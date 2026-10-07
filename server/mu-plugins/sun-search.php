<?php
/**
 * Plugin Name: Sun Search (MyISAM FULLTEXT)
 * Description: Fast, self-hosted search via a dedicated MyISAM FULLTEXT index
 *              table (reliable, unlike InnoDB FTS on this large table). Adds a
 *              read-only REST endpoint and keeps the index in sync on save/
 *              delete. Safe to delete at any time.
 * Version: 1.0
 */

defined('ABSPATH') || exit;

class Sun_Search {

    const TABLE = 'sun_search_ft';
    const INDEXED_POST_TYPES = array('post');

    private static $instance = null;

    public static function init() {
        if (null === self::$instance) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', array($this, 'register'));
        add_action('save_post', array($this, 'on_save'), 20, 3);
        add_action('deleted_post', array($this, 'on_delete'));
    }

    private function table() {
        global $wpdb;
        return $wpdb->prefix . self::TABLE;
    }

    public function register() {
        register_rest_route('thesun/v1', '/search', array(
            'methods'             => 'GET',
            'permission_callback' => '__return_true',
            'callback'            => array($this, 'handle'),
            'args'                => array(
                'q'        => array('required' => true),
                'page'     => array('default' => 1),
                'per_page' => array('default' => 13),
            ),
        ));
    }

    // Words ignored when building the required (AND) terms.
    private $stopwords = array(
        'this', 'that', 'with', 'from', 'have', 'were', 'will', 'your', 'they', 'them',
        'their', 'been', 'more', 'some', 'such', 'than', 'then', 'into', 'over', 'only',
        'also', 'just', 'like', 'made', 'make', 'many', 'much', 'most', 'when', 'what',
        'which', 'whom', 'would', 'could', 'should', 'about', 'after', 'before', 'because',
        'while', 'where', 'there', 'these', 'those', 'other', 'every', 'both', 'each',
        'same', 'does', 'done', 'doing',
    );

    /**
     * Multi-word queries require every word (AND, via BOOLEAN "+word*") so a
     * common word like "razak" can't flood results. Words shorter than the
     * MyISAM minimum (4) and stopwords are dropped. Returns '' when no usable
     * term remains (caller then uses natural language).
     */
    private function boolean_terms($q) {
        $terms = array();
        foreach (preg_split('/\s+/', (string) $q) as $w) {
            $w = trim(preg_replace('/[+\-><()~*"@:]+/', ' ', $w));
            if (strlen($w) < 4) continue;
            if (in_array(strtolower($w), $this->stopwords, true)) continue;
            $terms[] = '+' . $w . '*';
        }
        return implode(' ', $terms);
    }

    public function handle($req) {
        global $wpdb;
        $q    = trim((string) $req->get_param('q'));
        $page = max(1, (int) $req->get_param('page'));
        $per  = min(30, max(1, (int) $req->get_param('per_page')));
        $off  = ($page - 1) * $per;

        $respond = function ($ids, $total) {
            $r = rest_ensure_response(array('ids' => array_values($ids), 'total' => (int) $total));
            $r->header('X-Total', (string) (int) $total);
            $r->header('Cache-Control', 'no-store, max-age=0');
            $r->header('X-LiteSpeed-Cache-Control', 'no-cache');
            return $r;
        };

        if ($q === '') return $respond(array(), 0);

        $t = $this->table();
        // Guard: if the table isn't built yet, fail soft.
        $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $t));
        if (!$exists) return $respond(array(), 0);

        // Require all words (AND) when possible.
        $terms = $this->boolean_terms($q);
        $mode  = $terms !== '' ? ' IN BOOLEAN MODE' : '';
        $match = $terms !== '' ? $terms : $q;

        $total = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$t} WHERE MATCH(content) AGAINST(%s{$mode})",
            $match
        ));

        // AND yielded nothing → fall back to natural language (OR).
        if ($total === 0 && $terms !== '') {
            $mode  = '';
            $match = $q;
            $total = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$t} WHERE MATCH(content) AGAINST(%s)",
                $match
            ));
        }

        if ($total === 0) return $respond(array(), 0);

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT s.post_id FROM {$t} s
             JOIN {$wpdb->posts} p ON p.ID = s.post_id
             WHERE MATCH(s.content) AGAINST(%s{$mode})
             ORDER BY p.post_date DESC
             LIMIT %d OFFSET %d",
            $match, $per, $off
        ), ARRAY_A);

        $ids = array();
        foreach ((array) $rows as $r) {
            $id = (int) $r['post_id'];
            if ($id) $ids[] = $id;
        }
        return $respond($ids, $total);
    }

    /* ------------------------- index maintenance ------------------------- */

    public function on_save($post_id, $post, $update) {
        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) return;
        if (!is_object($post)) return;
        if (!in_array($post->post_type, self::INDEXED_POST_TYPES, true)) return;
        if ($post->post_status !== 'publish') { $this->remove($post_id); return; }
        $this->upsert($post_id);
    }

    public function on_delete($post_id) {
        $this->remove($post_id);
    }

    public function upsert($post_id) {
        global $wpdb;
        $p = get_post($post_id);
        if (!$p || $p->post_status !== 'publish' || !in_array($p->post_type, self::INDEXED_POST_TYPES, true)) {
            $this->remove($post_id);
            return;
        }
        $content = wp_strip_all_tags(
            $p->post_title . ' ' . $p->post_excerpt . ' ' . $p->post_content . ' ' . $this->author_names($post_id, $p)
        );
        $wpdb->replace($this->table(), array('post_id' => $post_id, 'content' => $content), array('%d', '%s'));
    }

    /**
     * Author names to include in the index (PublishPress Authors taxonomy plus
     * the core WP user display name), so people can search by author.
     */
    private function author_names($post_id, $post = null) {
        $names = array();
        $terms = wp_get_object_terms($post_id, 'author', array('fields' => 'names'));
        if (!is_wp_error($terms)) $names = $terms;
        if ($post && !empty($post->post_author)) {
            $display = get_the_author_meta('display_name', $post->post_author);
            if ($display) $names[] = $display;
        }
        return implode(' ', array_unique(array_filter($names)));
    }

    private function remove($post_id) {
        global $wpdb;
        $wpdb->delete($this->table(), array('post_id' => $post_id), array('%d'));
    }

    /* ------------------------------ build ------------------------------- */

    public function create_table() {
        global $wpdb;
        $t = $this->table();
        $charset = $wpdb->get_charset_collate();
        // MyISAM: reliable full-text search on large tables.
        $wpdb->query("CREATE TABLE IF NOT EXISTS {$t} (
            post_id BIGINT UNSIGNED NOT NULL,
            content LONGTEXT NOT NULL,
            PRIMARY KEY (post_id)
        ) ENGINE=MyISAM {$charset}");
    }

    public function has_fulltext() {
        global $wpdb;
        $t = $this->table();
        return (bool) $wpdb->get_var("SHOW INDEX FROM {$t} WHERE Index_type = 'FULLTEXT'");
    }

    /**
     * Builds/rebuilds the whole index: creates the table, bulk-loads published
     * posts, then adds the FULLTEXT index (MyISAM builds this quickly).
     */
    public function rebuild() {
        global $wpdb;
        $this->create_table();
        $t = $this->table();
        $amap = $wpdb->prefix . 'sun_search_authors';

        // 1) Author-name map (built off the index table, so it never locks search).
        $wpdb->query("DROP TABLE IF EXISTS {$amap}");
        $wpdb->query("CREATE TABLE {$amap} (post_id BIGINT UNSIGNED NOT NULL, names TEXT, PRIMARY KEY (post_id)) ENGINE=MyISAM");
        $wpdb->query(
            "INSERT IGNORE INTO {$amap} (post_id, names)
             SELECT tr.object_id, GROUP_CONCAT(t.name SEPARATOR ' ')
             FROM {$wpdb->term_relationships} tr
             JOIN {$wpdb->term_taxonomy} tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
             JOIN {$wpdb->terms} t ON t.term_id = tt.term_id
             WHERE tt.taxonomy = 'author'
             GROUP BY tr.object_id"
        );

        // 2) Drop the FULLTEXT index for a fast bulk load, then rebuild it once.
        if ($this->has_fulltext()) {
            $wpdb->query("ALTER TABLE {$t} DROP INDEX ft_content");
        }
        $wpdb->query("TRUNCATE TABLE {$t}");
        $wpdb->query(
            "INSERT INTO {$t} (post_id, content)
             SELECT p.ID, CONCAT_WS(' ', p.post_title, p.post_excerpt, p.post_content,
                      COALESCE(a.names, ''), COALESCE(u.display_name, ''))
             FROM {$wpdb->posts} p
             LEFT JOIN {$amap} a ON a.post_id = p.ID
             LEFT JOIN {$wpdb->users} u ON u.ID = p.post_author
             WHERE p.post_status = 'publish' AND p.post_type = 'post'"
        );
        $wpdb->query("DROP TABLE IF EXISTS {$amap}");

        $wpdb->query("ALTER TABLE {$t} ADD FULLTEXT INDEX ft_content (content)");

        return array('rows' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$t}"));
    }
}

Sun_Search::init();

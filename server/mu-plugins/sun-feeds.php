<?php
/**
 * Plugin Name: Sun Feed IDs
 * Description: Read-only, cached ID feeds for the new front end
 *              (latest, breaking, most-viewed, trending-now). Adds ONE public
 *              REST route and writes nothing except short-lived transients.
 *              It never alters core WordPress behaviour, existing queries,
 *              options, or cron. Safe to delete at any time.
 * Version: 1.1
 */

defined('ABSPATH') || exit;

class Sun_Feed_IDs {

    private static $instance = null;

    // Editorial tags used for the "Breaking" carousel. 'breaking' is included
    // on purpose so it starts working automatically if the newsroom ever adds it.
    private $breaking_slugs = array('pin', 'top-stories', 'exclusive', 'breaking');

    // GA4 ranked options keyed by range.
    private $range_options = array(
        '24h' => 'ga4_trending_24h',
        '7d'  => 'ga4_trending_7d',
        '30d' => 'ga4_trending_30d',
    );

    private $cache_ttl = 60;

    public static function init() {
        if (null === self::$instance) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', array($this, 'register'));
    }

    public function register() {
        register_rest_route('thesun/v1', '/feed-ids', array(
            'methods'             => 'GET',
            'permission_callback' => '__return_true',
            'callback'            => array($this, 'handle'),
            'args'                => array(
                'type'   => array('default' => 'latest'),
                'range'  => array('default' => '24h'),
                'limit'  => array('default' => 10),
                'offset' => array('default' => 0),
            ),
        ));
    }

    public function handle($req) {
        $type   = sanitize_key($req->get_param('type'));
        $range  = sanitize_key($req->get_param('range'));
        $limit  = min(50, max(1, (int) $req->get_param('limit')));
        $offset = max(0, (int) $req->get_param('offset'));

        $key    = 'sun_feed_ids_' . $type . '_' . $range . '_' . $limit . '_' . $offset;
        $cached = get_transient($key);
        if (is_array($cached) && isset($cached['ids'], $cached['total'])) {
            return $this->respond($cached['ids'], $cached['total']);
        }

        $result = $this->resolve($type, $range, $limit, $offset);
        set_transient($key, $result, $this->cache_ttl);
        return $this->respond($result['ids'], $result['total']);
    }

    private function resolve($type, $range, $limit, $offset) {
        // Readership feeds come straight from the GA4 options already refreshed
        // by the hourly / 5-minute / daily crons. No external calls here.
        if ($type === 'most-viewed') {
            $option = isset($this->range_options[$range]) ? $this->range_options[$range] : 'ga4_trending_24h';
            return $this->slice_ranked(get_option($option, array()), $limit, $offset);
        }
        if ($type === 'trending-now') {
            return $this->slice_ranked(get_option('ga4_trending_realtime', array()), $limit, $offset);
        }

        $args = array(
            'post_type'              => 'post',
            'post_status'            => 'publish',
            'posts_per_page'         => $limit,
            'offset'                 => $offset,
            'orderby'                => 'date',
            'order'                  => 'DESC',
            'no_found_rows'          => true,
            'ignore_sticky_posts'    => true,
            'update_post_meta_cache' => false,
            'update_post_term_cache' => false,
            'fields'                 => 'ids',
        );

        if ($type === 'breaking') {
            $term_ids = $this->breaking_term_ids();
            if (empty($term_ids)) return array('ids' => array(), 'total' => 0);
            $args['tag__in'] = $term_ids;
        }

        $q   = new WP_Query($args);
        $ids = array_map('intval', (array) $q->posts);
        return array('ids' => $ids, 'total' => 0);
    }

    private function slice_ranked($ranked, $limit, $offset) {
        if (!is_array($ranked) || empty($ranked)) return array('ids' => array(), 'total' => 0);
        $total = count($ranked);
        $slice = array_slice($ranked, $offset, $limit);
        $ids   = array();
        foreach ($slice as $row) {
            $id = isset($row['id']) ? (int) $row['id'] : 0;
            if ($id > 0) $ids[] = $id;
        }
        return array('ids' => $ids, 'total' => $total);
    }

    private function breaking_term_ids() {
        $ids = array();
        foreach ($this->breaking_slugs as $slug) {
            $term = get_term_by('slug', $slug, 'post_tag');
            if ($term && !is_wp_error($term)) $ids[] = (int) $term->term_id;
        }
        return $ids;
    }

    private function respond($ids, $total) {
        $res = rest_ensure_response(array_map('intval', $ids));
        $res->header('X-Total', (string) max(0, (int) $total));
        $res->header('Cache-Control', 'public, max-age=60');
        return $res;
    }
}

Sun_Feed_IDs::init();

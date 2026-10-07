<?php
/**
 * Plugin Name: Sun GA4 Trending
 * Description: Fetch 24h + 7d + 30d + realtime article views from the GA4 Data
 *              API and store them in options for the feed/trending endpoints.
 *              Light on the server: 24h/7d hourly, 30d daily, realtime every
 *              5 minutes; each call just replaces an option. No per-request
 *              API calls.
 * Version: 1.2
 */

defined('ABSPATH') || exit;

class Sun_GA4_Trending {

    private static $instance = null;
    private $property_id = '309903820';
    private $credentials_path = '/home/sunmedia/credentials/ga4-service-account.json';
    private $vendor_autoload = WP_CONTENT_DIR . '/plugins/ga4-vendor/vendor/autoload.php';
    private $token = null;
    private $max_rows = 100;   // posts kept per window
    private $report_limit = 200; // GA4 rows requested (path/title misses absorb some)

    public static function init() {
        if (null === self::$instance) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        add_filter('cron_schedules', array($this, 'add_schedules'));
        add_action('init', array($this, 'schedule'));
        add_action('sun_ga4_trending_24h', array($this, 'fetch_24h'));
        add_action('sun_ga4_trending_7d', array($this, 'fetch_7d'));
        add_action('sun_ga4_trending_30d', array($this, 'fetch_30d'));
        add_action('sun_ga4_trending_rt', array($this, 'fetch_rt'));
    }

    public function add_schedules($s) {
        if (!isset($s['sun_five_minutes'])) {
            $s['sun_five_minutes'] = array('interval' => 300, 'display' => 'Every 5 minutes (Sun)');
        }
        return $s;
    }

    public function schedule() {
        if (!wp_next_scheduled('sun_ga4_trending_24h')) wp_schedule_event(time() + 120, 'hourly', 'sun_ga4_trending_24h');
        if (!wp_next_scheduled('sun_ga4_trending_7d'))  wp_schedule_event(time() + 240, 'hourly', 'sun_ga4_trending_7d');
        if (!wp_next_scheduled('sun_ga4_trending_30d')) wp_schedule_event(time() + 360, 'daily', 'sun_ga4_trending_30d');
        if (!wp_next_scheduled('sun_ga4_trending_rt'))  wp_schedule_event(time() + 180, 'sun_five_minutes', 'sun_ga4_trending_rt');
    }

    private function token() {
        if ($this->token) return $this->token;
        if (!file_exists($this->vendor_autoload) || !file_exists($this->credentials_path)) return null;
        require_once $this->vendor_autoload;
        putenv('GOOGLE_API_USE_REST=true');
        try {
            $creds = new Google\Auth\Credentials\ServiceAccountCredentials(
                'https://www.googleapis.com/auth/analytics.readonly',
                $this->credentials_path
            );
            $t = $creds->fetchAuthToken();
            $this->token = isset($t['access_token']) ? $t['access_token'] : null;
        } catch (Exception $e) {
            error_log('[Sun GA4 Trending] token: ' . $e->getMessage());
            return null;
        }
        return $this->token;
    }

    private function report($endpoint, $body) {
        $token = $this->token();
        if (!$token) return null;
        $url = "https://analyticsdata.googleapis.com/v1beta/properties/{$this->property_id}:{$endpoint}";
        $res = wp_remote_post($url, array(
            'timeout' => 20,
            'headers' => array('Authorization' => 'Bearer ' . $token, 'Content-Type' => 'application/json'),
            'body'    => wp_json_encode($body),
        ));
        if (is_wp_error($res)) { error_log('[Sun GA4 Trending] ' . $res->get_error_message()); return null; }
        $code = wp_remote_retrieve_response_code($res);
        if ($code !== 200) { error_log('[Sun GA4 Trending] HTTP ' . $code . ' ' . substr(wp_remote_retrieve_body($res), 0, 200)); return null; }
        return json_decode(wp_remote_retrieve_body($res), true);
    }

    /* Window report is dimensioned by pagePath → resolved with url_to_postid. */
    private function rows_to_posts_by_path($data) {
        $out = array();
        $rows = isset($data['rows']) ? $data['rows'] : array();
        foreach ($rows as $row) {
            $path = isset($row['dimensionValues'][0]['value']) ? $row['dimensionValues'][0]['value'] : '';
            $views = (int) (isset($row['metricValues'][0]['value']) ? $row['metricValues'][0]['value'] : 0);
            if ($path === '' || $views <= 0) continue;
            $id = url_to_postid(home_url($path));
            if ($id && get_post_type($id) === 'post') $out[] = array('id' => $id, 'views' => $views);
            if (count($out) >= $this->max_rows) break;
        }
        return $out;
    }

    /* Realtime API can't give a URL path; it gives the screen/page title, which
       for this site is the post title (sometimes with a site-name suffix). */
    private function title_to_id($name) {
        global $wpdb;
        $name = trim(urldecode($name));
        if ($name === '' || $name === '(other)') return 0;
        $candidates = array($name);
        $stripped = preg_replace('/\s*[|\x{2013}\x{2014}-]\s*(theSun|The Sun.*)$/iu', '', $name);
        if ($stripped && $stripped !== $name) $candidates[] = trim($stripped);
        foreach ($candidates as $title) {
            if ($title === '') continue;
            $id = $wpdb->get_var($wpdb->prepare(
                "SELECT ID FROM {$wpdb->posts} WHERE post_title = %s AND post_type = 'post' AND post_status = 'publish' ORDER BY post_date DESC LIMIT 1",
                $title
            ));
            if ($id) return (int) $id;
        }
        return 0;
    }

    private function rows_to_posts_by_title($data) {
        $out = array();
        $rows = isset($data['rows']) ? $data['rows'] : array();
        foreach ($rows as $row) {
            $name = isset($row['dimensionValues'][0]['value']) ? $row['dimensionValues'][0]['value'] : '';
            $views = (int) (isset($row['metricValues'][0]['value']) ? $row['metricValues'][0]['value'] : 0);
            if ($name === '' || $views <= 0) continue;
            $id = $this->title_to_id($name);
            if ($id) $out[] = array('id' => $id, 'views' => $views);
            if (count($out) >= $this->max_rows) break;
        }
        return $out;
    }

    /* Generic window fetch (24h / 7d / 30d). */
    private function fetch_window($startDate, $option, $lock) {
        if (get_transient($lock)) return;
        set_transient($lock, 1, 300);
        $data = $this->report('runReport', array(
            'dateRanges' => array(array('startDate' => $startDate, 'endDate' => 'today')),
            'dimensions' => array(array('name' => 'pagePath')),
            'metrics'    => array(array('name' => 'screenPageViews')),
            'limit'      => $this->report_limit,
        ));
        if ($data) update_option($option, $this->rows_to_posts_by_path($data), false);
        delete_transient($lock);
    }

    public function fetch_24h() { $this->fetch_window('1daysAgo', 'ga4_trending_24h', 'sun_ga4_lock_24h'); }
    public function fetch_7d()  { $this->fetch_window('7daysAgo', 'ga4_trending_7d',  'sun_ga4_lock_7d'); }
    public function fetch_30d() { $this->fetch_window('30daysAgo', 'ga4_trending_30d', 'sun_ga4_lock_30d'); }

    public function fetch_rt() {
        if (get_transient('sun_ga4_lock_rt')) return;
        set_transient('sun_ga4_lock_rt', 1, 120);
        $data = $this->report('runRealtimeReport', array(
            'dimensions' => array(array('name' => 'unifiedScreenName')),
            'metrics'    => array(array('name' => 'screenPageViews')),
            'limit'      => 50,
        ));
        if ($data) update_option('ga4_trending_realtime', $this->rows_to_posts_by_title($data), false);
        delete_transient('sun_ga4_lock_rt');
    }
}

Sun_GA4_Trending::init();

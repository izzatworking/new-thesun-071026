<?php
/**
 * Plugin Name: Sun API Guard
 * Description: Blocks a small set of external domains from using the WordPress REST/GraphQL API, matched by the request Origin/Referer host. Read-only; safe to delete.
 * Version: 1.0
 */

defined('ABSPATH') || exit;

class Sun_API_Guard {

    // Blocked hosts (suffix match: exact host or any subdomain, incl. www.).
    private $blocked = array('thesunai.my', 'newshub.my', 'gea.com', 'thesunit.my');

    private static $instance = null;

    public static function init() {
        if (null === self::$instance) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        add_filter('rest_authentication_errors', array($this, 'rest_block'), 99);
        add_action('send_headers', array($this, 'graphql_block'));
    }

    /** Returns the matched blocked host, or false. */
    private function blocked_host() {
        foreach (array('HTTP_ORIGIN', 'HTTP_REFERER') as $key) {
            if (empty($_SERVER[$key])) continue;
            $host = wp_parse_url($_SERVER[$key], PHP_URL_HOST);
            if (!$host) continue;
            $host = strtolower($host);
            foreach ($this->blocked as $b) {
                if ($host === $b || substr($host, -strlen($b) - 1) === '.' . $b) {
                    return $b;
                }
            }
        }
        return false;
    }

    /** Blocks the REST API (wp-json) for blocked origins/referers. */
    public function rest_block($result) {
        if ($this->blocked_host() !== false) {
            return new WP_Error('rest_blocked', 'Forbidden', array('status' => 403));
        }
        return $result;
    }

    /** Blocks the wp-graphql endpoint (/graphql), which isn't covered by rest_authentication_errors. */
    public function graphql_block() {
        $uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        if (strpos($uri, '/graphql') === false) return;
        if ($this->blocked_host() === false) return;
        status_header(403);
        header('Content-Type: application/json; charset=utf-8');
        echo wp_json_encode(array('errors' => array(array('message' => 'Forbidden'))));
        exit;
    }
}

Sun_API_Guard::init();

<?php
/**
 * Plugin Name: Sun Tag Cache
 * Description: Cache /wp/v2/tags REST responses and cap the editor's tag browse
 *              to the top 200 tags (stops Gutenberg paginating through 600+ pages).
 * Version: 1.3
 * NOTE: The cache key MUST include every meaningful query param (slug, post,
 *       search, include, orderby, ...). v1.2 omitted slug/post, so every
 *       /tags?slug=<x> request returned the first cached list (top tags, first
 *       = "pin") — which made every tag page render #pin.
 */

defined( 'ABSPATH' ) || exit;

class Sun_Tag_Cache {

    private static $instance = null;
    private $cache_ttl = 300;
    private $max_tags  = 200;

    public static function init() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_filter( 'rest_pre_dispatch', array( $this, 'intercept_tags_request' ), 10, 3 );
        add_filter( 'rest_post_tag_query', array( $this, 'cap_tags_query' ), 10, 2 );
        add_filter( 'rest_post_dispatch', array( $this, 'cache_tags_response' ), 10, 3 );
        add_action( 'created_term', array( $this, 'purge_tag_cache' ) );
        add_action( 'edited_term',  array( $this, 'purge_tag_cache' ) );
        add_action( 'delete_term',  array( $this, 'purge_tag_cache' ) );
    }

    /* Browse = no include / slug / search / post. Those (search, specific tags) stay untouched. */
    private function is_browse_request( $request ) {
        if ( ! empty( $request['include'] ) || ! empty( $request['slug'] ) || ! empty( $request['search'] ) || ! empty( $request['post'] ) ) {
            return false;
        }
        return true;
    }

    /* Limit the DB query for browse requests (WP_Term_Query uses 'number'/'offset'). */
    public function cap_tags_query( $args, $request ) {
        if ( $this->is_browse_request( $request ) ) {
            $args['number'] = $this->max_tags;
            $args['offset'] = 0;
        }
        return $args;
    }

    private function get_cache_key( $request ) {
        $route = $request->get_route();
        if ( strpos( $route, '/wp/v2/tags' ) === false ) {
            return false;
        }

        // Key on EVERY relevant parameter (slug/post/search/include/orderby/
        // order/page/per_page/hide_empty...). Omitting any of them makes two
        // different requests share one cached body.
        $params = $request->get_params();
        if ( ! is_array( $params ) ) {
            $params = array();
        }
        unset( $params['_'] ); // cache-buster param, if any
        // Drop values that are empty so defaults don't fragment the cache.
        foreach ( $params as $k => $v ) {
            if ( '' === $v || null === $v ) {
                unset( $params[ $k ] );
            }
        }
        ksort( $params );

        $version = (int) get_option( 'sun_tag_cache_version', 1 );
        return 'sun_tags_' . $version . '_' . md5( wp_json_encode( $params ) );
    }

    public function intercept_tags_request( $result, $server, $request ) {
        $cache_key = $this->get_cache_key( $request );
        if ( false === $cache_key ) {
            return $result;
        }
        $cached = get_transient( $cache_key );
        if ( false === $cached ) {
            return $result;
        }
        $data = json_decode( $cached, true );
        if ( ! is_array( $data ) || ! isset( $data['body'] ) || ! isset( $data['headers'] ) ) {
            return $result;
        }
        $response = new WP_REST_Response( $data['body'], 200 );
        foreach ( $data['headers'] as $key => $value ) {
            $response->header( $key, $value );
        }
        return $response;
    }

    public function cache_tags_response( $response, $server, $request ) {
        $cache_key = $this->get_cache_key( $request );
        if ( false === $cache_key ) {
            return $response;
        }
        if ( 200 !== $response->get_status() ) {
            return $response;
        }

        // For browse: report a single page so core-data's pagination loop stops. VALID APIs only.
        if ( $this->is_browse_request( $request ) ) {
            $h = $response->get_headers();
            $h['X-WP-Total']      = $this->max_tags;
            $h['X-WP-TotalPages'] = 1;
            unset( $h['Link'] );
            $response->set_headers( $h );
        }

        if ( false !== get_transient( $cache_key ) ) {
            return $response;
        }

        $headers       = $response->get_headers();
        $cache_headers = array();
        foreach ( array( 'X-WP-Total', 'X-WP-TotalPages', 'Link' ) as $hk ) {
            if ( isset( $headers[ $hk ] ) ) {
                $cache_headers[ $hk ] = $headers[ $hk ];
            }
        }
        $data = array( 'body' => $response->get_data(), 'headers' => $cache_headers );
        set_transient( $cache_key, wp_json_encode( $data ), $this->cache_ttl );
        return $response;
    }

    public function purge_tag_cache() {
        $version = (int) get_option( 'sun_tag_cache_version', 1 );
        update_option( 'sun_tag_cache_version', $version + 1 );
    }
}

Sun_Tag_Cache::init();

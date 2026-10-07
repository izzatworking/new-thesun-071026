import { useEffect, useRef } from 'react'
import useSeo from '@/lib/useSeo'
import { SITE_URL } from '@/lib/urls'

/**
 * The Sun Malaysia Video Hub
 * ------------------------------------------------------------------
 * This page was originally a standalone Index.html (its own header,
 * ticker, clock, footer, dark theme, vanilla JS). It now lives inside
 * the SPA as a real route, sitting under the site's actual SiteHeader
 * and above SiteFooter — so its own duplicate logo/ticker/clock/footer
 * were removed and only the tab menu + search + video grids remain.
 *
 * Because the original widget is vanilla JS/CSS (direct DOM writes,
 * global function calls), it's mounted here via a container ref rather
 * than rewritten line-by-line into JSX — this keeps 100% of the original
 * behaviour intact (YouTube data fetching, tabs, lightbox, search,
 * "load more" pagination, shorts scroller) while still playing nicely
 * inside React:
 *   - All CSS is scoped under .thesun-video-page so it can never leak
 *     out and restyle the rest of the site (the original file had raw
 *     `body`, `a`, `button`, `img`, `:root` rules that would otherwise
 *     repaint the whole app while this page is open).
 *   - Inline onclick="fn()" strings were replaced with a single
 *     delegated click listener (no functions are attached to `window`).
 *   - Everything is cleaned up on unmount (listeners, injected <style>,
 *     in-flight fetch loop) so navigating away mid-load can't throw.
 *   - Removed a leftover bug: init() used to call loadPlaylists(), a
 *     function that was never defined anywhere in the file.
 */

const VIDEO_PAGE_CSS = `
.thesun-video-page{
  --tvp-bg:hsl(var(--background));
  --tvp-panel:hsl(var(--card));
  --tvp-panel-2:hsl(var(--muted));
  --tvp-line:hsl(var(--border));
  --tvp-blue:hsl(var(--primary));
  --tvp-purple:hsl(var(--secondary));
  --tvp-cyan:hsl(var(--primary));
  --tvp-text:hsl(var(--foreground));
  --tvp-muted:hsl(var(--muted-foreground));
  --tvp-muted-2:hsl(var(--muted-foreground));
  --tvp-header-h:64px;
  --tvp-mobile-nav-h:76px;
  background:var(--tvp-bg);
  color:var(--tvp-text);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;
  min-height:100%;
  display:block;
  position:relative;
  overflow-x:hidden;
  isolation:isolate;
}
.thesun-video-page::before{
  content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;
  background:
    radial-gradient(600px circle at 8% 0%, hsl(var(--primary) / .06), transparent 60%),
    radial-gradient(700px circle at 100% 15%, hsl(var(--secondary) / .05), transparent 60%),
    radial-gradient(650px circle at 15% 100%, hsl(var(--primary) / .04), transparent 60%);
}
.thesun-video-page *{box-sizing:border-box;}
.thesun-video-page h1,.thesun-video-page h2,.thesun-video-page h3,.thesun-video-page .hero-title{
  font-family:'Inter',system-ui,sans-serif;font-weight:800;letter-spacing:-.01em;
}
.thesun-video-page a{color:inherit;text-decoration:none;}
.thesun-video-page button{font-family:inherit;cursor:pointer;}
.thesun-video-page img{display:block;max-width:100%;}
.thesun-video-page ::selection{background:hsl(var(--primary));color:#fff;}

/* ---------- Header (tab menu + search only) ---------- */
.thesun-video-page header.site-header{
  position:sticky;top:0;z-index:40;
  background:hsl(var(--background) / .85);
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border-bottom:1px solid var(--tvp-line);
}
.thesun-video-page .header-inner{
  max-width:1400px;margin:0 auto;
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 20px;height:var(--tvp-header-h);
}
.thesun-video-page nav.desktop-nav{display:flex;gap:6px;flex:1;}
.thesun-video-page nav.desktop-nav button{
  background:transparent;border:1px solid transparent;color:var(--tvp-muted);
  font-weight:700;font-size:14.5px;padding:9px 16px;border-radius:999px;transition:.2s;
}
.thesun-video-page nav.desktop-nav button:hover{color:var(--tvp-text);background:hsl(var(--muted));border-color:var(--tvp-line);}
.thesun-video-page nav.desktop-nav button.active{
  color:hsl(var(--primary-foreground));background:hsl(var(--primary));
  box-shadow:0 8px 20px -8px hsl(var(--primary) / .5);
}

.thesun-video-page .header-right{display:flex;align-items:center;gap:14px;}
.thesun-video-page .icon-btn{
  background:hsl(var(--muted));border:1px solid var(--tvp-line);color:var(--tvp-muted);width:36px;height:36px;
  display:flex;align-items:center;justify-content:center;border-radius:50%;
  transition:.2s;
}
.thesun-video-page .icon-btn:hover{color:hsl(var(--primary));background:hsl(var(--muted));border-color:hsl(var(--primary) / .4);}
.thesun-video-page #subscribe-slot{width:154px;height:34px;overflow:hidden;flex-shrink:0;border-radius:8px;}
.thesun-video-page #subscribe-slot iframe{width:100%;height:100%;}

.thesun-video-page .search-bar{
  display:none;align-items:center;gap:8px;background:hsl(var(--muted));
  border:1px solid var(--tvp-line);border-radius:999px;padding:7px 14px;
}
.thesun-video-page .search-bar.open{display:flex;}
.thesun-video-page .search-bar input{
  background:none;border:none;color:var(--tvp-text);font-size:14px;outline:none;width:180px;
}

/* ---------- Layout ---------- */
.thesun-video-page main{max-width:1400px;margin:0 auto;padding:32px 20px 60px;position:relative;z-index:1;}
.thesun-video-page .panel{display:none;}
.thesun-video-page .panel.active{display:block;}
.thesun-video-page .section-head{
  display:flex;align-items:center;justify-content:space-between;margin:40px 0 18px;
}
.thesun-video-page .section-head:first-child{margin-top:0;}
.thesun-video-page .section-head h2{
  font-size:21px;color:var(--tvp-text);margin:0;display:flex;align-items:center;gap:10px;
}
.thesun-video-page .section-head h2::before{
  content:'';width:9px;height:9px;border-radius:3px;flex-shrink:0;
  background:linear-gradient(135deg,var(--tvp-blue),var(--tvp-purple));
  box-shadow:0 0 12px hsl(var(--primary) / .5);
}
.thesun-video-page .view-all{
  color:var(--tvp-text);font-weight:700;font-size:13px;display:flex;align-items:center;gap:4px;cursor:pointer;
  background:hsl(var(--muted));border:1px solid var(--tvp-line);padding:7px 14px;border-radius:999px;transition:.2s;
}
.thesun-video-page .view-all:hover{background:hsl(var(--primary) / .08);color:hsl(var(--primary));}

/* ---------- Hero ---------- */
.thesun-video-page .hero{
  position:relative;overflow:hidden;
  display:grid;grid-template-columns:1fr 1.4fr;gap:32px;align-items:center;
  background:hsl(var(--card));
  border:1px solid var(--tvp-line);border-radius:32px;padding:36px;
  box-shadow:0 10px 40px -20px rgba(0,0,0,.12);
}
.thesun-video-page .hero::before{
  content:'';position:absolute;left:-10%;bottom:-30%;width:420px;height:420px;border-radius:50%;
  background:radial-gradient(circle,hsl(var(--primary) / .10),transparent 70%);z-index:0;pointer-events:none;
}
.thesun-video-page .hero::after{
  content:'';position:absolute;right:-10%;top:-30%;width:380px;height:380px;border-radius:50%;
  background:radial-gradient(circle,hsl(var(--secondary) / .08),transparent 70%);z-index:0;pointer-events:none;
}
.thesun-video-page .hero > div{position:relative;z-index:1;}
.thesun-video-page .hero-eyebrow{
  display:inline-flex;align-items:center;gap:7px;background:hsl(var(--primary) / .08);color:hsl(var(--primary));
  font-weight:700;font-size:11.5px;letter-spacing:1.2px;padding:7px 12px;border-radius:999px;margin-bottom:16px;
  border:1px solid hsl(var(--primary) / .2);
}
.thesun-video-page .hero-eyebrow::before{content:'';width:7px;height:7px;border-radius:50%;background:hsl(var(--primary));box-shadow:0 0 8px hsl(var(--primary) / .6);}
.thesun-video-page .hero-title{font-size:40px;line-height:1.08;color:var(--tvp-text);margin:0 0 14px;}
.thesun-video-page .hero-title .accent{
  background:linear-gradient(135deg,var(--tvp-blue),var(--tvp-purple));
  -webkit-background-clip:text;background-clip:text;color:transparent;
}
.thesun-video-page .hero-sub{color:var(--tvp-muted);font-size:15px;margin-bottom:22px;max-width:420px;}
.thesun-video-page .subscribe-cta{
  display:inline-flex;align-items:center;gap:8px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));
  font-weight:800;font-size:14px;padding:14px 24px;border-radius:999px;border:none;
  box-shadow:0 8px 24px -8px hsl(var(--primary) / .5);transition:.2s;
}
.thesun-video-page .subscribe-cta:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 12px 28px -8px hsl(var(--primary) / .6);}

.thesun-video-page .hero-video{
  position:relative;border-radius:22px;overflow:hidden;aspect-ratio:16/9;
  background:#111318;cursor:pointer;border:1px solid var(--tvp-line);
}
.thesun-video-page .hero-video img{width:100%;height:100%;object-fit:cover;}
.thesun-video-page .live-badge{
  position:absolute;top:14px;left:14px;background:rgba(10,10,15,.65);backdrop-filter:blur(8px);color:#fff;font-weight:700;
  font-size:11px;padding:5px 10px;border-radius:999px;display:flex;align-items:center;gap:6px;z-index:2;border:1px solid rgba(255,255,255,.18);
}
.thesun-video-page .live-badge::before{content:'';width:6px;height:6px;border-radius:50%;background:hsl(var(--primary));box-shadow:0 0 8px hsl(var(--primary) / .8);}
.thesun-video-page .watching-badge{
  position:absolute;bottom:0;left:0;right:0;padding:40px 16px 14px;
  background:linear-gradient(transparent,rgba(0,0,0,.85));
  display:flex;justify-content:space-between;align-items:flex-end;
}
.thesun-video-page .watching-badge .wtitle{font-weight:700;color:#fff;font-size:16px;}
.thesun-video-page .watching-badge .wsub{color:rgba(255,255,255,.75);font-size:12.5px;margin-top:2px;}
.thesun-video-page .play-circle{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:66px;height:66px;border-radius:50%;background:rgba(10,10,15,.5);border:1.5px solid rgba(255,255,255,.5);
  backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:2;transition:.2s;
}
.thesun-video-page .hero-video:hover .play-circle{background:hsl(var(--primary) / .5);border-color:hsl(var(--primary));}

/* ---------- Grids ---------- */
.thesun-video-page .grid{display:grid;gap:22px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));}
.thesun-video-page .grid.large-2{grid-template-columns:repeat(2,1fr);}
.thesun-video-page .grid.shorts-grid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr));}

.thesun-video-page .vcard{
  position:relative;background:var(--tvp-panel);border:1px solid var(--tvp-line);border-radius:22px;cursor:pointer;
  transition:transform .2s,border-color .2s,box-shadow .2s;box-shadow:0 1px 3px rgba(0,0,0,.05);
}
.thesun-video-page .vcard:hover{transform:translateY(-4px);border-color:hsl(var(--primary) / .35);box-shadow:0 12px 30px -14px rgba(0,0,0,.18);}
.thesun-video-page .vcard::after{
  content:'';position:absolute;left:14%;bottom:-26px;width:150px;height:110px;border-radius:50%;
  filter:blur(30px);opacity:.16;z-index:0;pointer-events:none;
  background:radial-gradient(circle,var(--tvp-blue),transparent 70%);
}
.thesun-video-page .vcard:nth-child(3n+2)::after{background:radial-gradient(circle,var(--tvp-purple),transparent 70%);left:auto;right:14%;}
.thesun-video-page .vcard:nth-child(3n)::after{background:radial-gradient(circle,var(--tvp-cyan),transparent 70%);}
.thesun-video-page .thumb-wrap{position:relative;aspect-ratio:16/9;background:#111318;overflow:hidden;border-radius:22px 22px 0 0;z-index:1;}
.thesun-video-page .thumb-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .3s;}
.thesun-video-page .vcard:hover .thumb-wrap img{transform:scale(1.06);}
.thesun-video-page .duration-badge{
  position:absolute;bottom:8px;right:8px;background:rgba(10,10,15,.75);backdrop-filter:blur(6px);color:#fff;
  font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.14);
}
.thesun-video-page .thumb-wrap .mini-play{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:48px;height:48px;border-radius:50%;background:rgba(10,10,15,.5);border:1.5px solid rgba(255,255,255,.6);
  backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;opacity:0;transition:.2s;
}
.thesun-video-page .vcard:hover .mini-play{opacity:1;background:hsl(var(--primary) / .55);border-color:hsl(var(--primary));}
.thesun-video-page .vcard-body{padding:14px 16px 18px;position:relative;z-index:1;}
.thesun-video-page .vcard-body h4{
  font-family:'Inter',sans-serif;font-weight:700;font-size:14.5px;color:var(--tvp-text);margin:0 0 8px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4;
}
.thesun-video-page .vcard-meta{color:var(--tvp-muted-2);font-size:12px;display:flex;gap:6px;align-items:center;}

.thesun-video-page .short-card .thumb-wrap{aspect-ratio:9/16;}
.thesun-video-page .short-card .vcard-body h4{font-size:13px;-webkit-line-clamp:2;}

.thesun-video-page .shorts-scroller{position:relative;}
.thesun-video-page .scroll-track{display:flex;gap:16px;overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;padding:4px 4px 8px;}
.thesun-video-page .scroll-track::-webkit-scrollbar{display:none;}
.thesun-video-page .scroll-track .vcard{flex:0 0 200px;}
.thesun-video-page .scroll-track .short-card{flex:0 0 170px;}
.thesun-video-page .scroll-arrow{
  position:absolute;top:40%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;
  background:hsl(var(--card));box-shadow:0 4px 16px -6px rgba(0,0,0,.2);border:1px solid var(--tvp-line);color:var(--tvp-text);display:flex;align-items:center;
  justify-content:center;z-index:5;transition:.2s;
}
.thesun-video-page .scroll-arrow.left{left:-10px;}
.thesun-video-page .scroll-arrow.right{right:-10px;}
.thesun-video-page .scroll-arrow:hover{background:hsl(var(--primary) / .1);border-color:hsl(var(--primary) / .4);color:hsl(var(--primary));}

.thesun-video-page .load-more-wrap{display:flex;justify-content:center;margin-top:34px;}
.thesun-video-page .load-more-btn{
  background:hsl(var(--primary));color:hsl(var(--primary-foreground));font-weight:800;font-size:14.5px;padding:14px 36px;border-radius:999px;border:none;
  box-shadow:0 10px 30px -10px hsl(var(--primary) / .5);transition:.2s;
}
.thesun-video-page .load-more-btn:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 14px 34px -8px hsl(var(--primary) / .6);}
.thesun-video-page .load-more-btn:disabled{opacity:.5;cursor:default;transform:none;}

.thesun-video-page .empty-state,.thesun-video-page .loading-state{
  text-align:center;padding:64px 20px;color:var(--tvp-muted);
}
.thesun-video-page .loading-state .spinner{
  width:34px;height:34px;border-radius:50%;border:3px solid var(--tvp-line);border-top-color:hsl(var(--primary));
  margin:0 auto 14px;animation:thesunVideoSpin 0.8s linear infinite;
}
@keyframes thesunVideoSpin{to{transform:rotate(360deg);}}
.thesun-video-page .error-banner{
  background:hsl(var(--primary) / .06);border:1px solid hsl(var(--primary) / .25);color:var(--tvp-text);border-radius:16px;padding:16px 20px;
  font-size:14px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;gap:12px;
}
.thesun-video-page .error-banner button{background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:none;padding:9px 16px;border-radius:999px;font-weight:700;font-size:13px;flex-shrink:0;}

/* ---------- Lightbox ---------- */
.thesun-video-page .lightbox{
  position:fixed;inset:0;background:rgba(5,5,8,.85);backdrop-filter:blur(6px);z-index:100;display:none;
  align-items:center;justify-content:center;padding:26px;
}
.thesun-video-page .lightbox.open{display:flex;}
.thesun-video-page .lightbox-inner{width:100%;max-width:960px;position:relative;}
.thesun-video-page .lightbox-player{position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.12);}
.thesun-video-page .lightbox-player.vertical{max-width:400px;aspect-ratio:9/16;margin:0 auto;}
.thesun-video-page .lightbox-player iframe{width:100%;height:100%;border:none;}
.thesun-video-page .lightbox-title{color:#fff;font-weight:700;font-size:16px;margin-top:18px;}
.thesun-video-page .lightbox-close{
  position:absolute;top:-52px;right:0;width:38px;height:38px;border-radius:50%;
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:20px;line-height:1;
  z-index:5;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:.2s;
}
.thesun-video-page .lightbox-close:hover{background:rgba(255,255,255,.2);}
@media (max-width:640px){.thesun-video-page .lightbox-close{top:-46px;}}

/* ---------- Mobile bottom nav — mobile-only tab bar, hidden by default (desktop) ---------- */
.thesun-video-page nav.mobile-nav{
  position:fixed;left:12px;right:12px;bottom:12px;z-index:50;display:none;
  background:hsl(var(--background) / .92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border:1px solid var(--tvp-line);border-radius:24px;
  padding:10px 4px calc(10px + env(safe-area-inset-bottom));
  box-shadow:0 20px 50px -20px rgba(0,0,0,.25);
}
.thesun-video-page .mobile-nav .row{display:flex;justify-content:space-around;}
.thesun-video-page .mobile-nav button{
  background:none;border:none;color:var(--tvp-muted-2);display:flex;flex-direction:column;
  align-items:center;gap:5px;font-size:11px;font-weight:600;flex:1;padding:6px 0;border-radius:14px;transition:.2s;
}
.thesun-video-page .mobile-nav button svg{width:22px;height:22px;}
.thesun-video-page .mobile-nav button.active{color:hsl(var(--primary));background:hsl(var(--primary) / .08);}
.thesun-video-page .mobile-nav button.active svg{stroke:hsl(var(--primary));}

/* Below this breakpoint = "mobile view": desktop tab menu hides, bottom tab bar shows.
   Above it = "desktop view": nav.mobile-nav stays display:none from the rule above. */
@media (max-width:900px){
  .thesun-video-page nav.desktop-nav{display:none;}
  .thesun-video-page nav.mobile-nav{display:block;}
  .thesun-video-page{padding-bottom:calc(var(--tvp-mobile-nav-h) + 12px);}
  .thesun-video-page .hero{grid-template-columns:1fr;border-radius:26px;padding:26px;}
  .thesun-video-page .hero-title{font-size:29px;}
  .thesun-video-page .grid.large-2{grid-template-columns:1fr;}
  .thesun-video-page #subscribe-slot{width:120px;}
}
@media (max-width:520px){
  .thesun-video-page .header-inner{padding:10px 14px;}
  .thesun-video-page main{padding:24px 14px 40px;}
  .thesun-video-page .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px;}
  .thesun-video-page .grid.shorts-grid{grid-template-columns:repeat(2,1fr);}
}
`

const VIDEO_PAGE_HTML = `
<header class="site-header">
  <div class="header-inner">
    <nav class="desktop-nav" id="desktopNav">
      <button data-tab="home" class="active">Home</button>
      <button data-tab="videos">Videos</button>
      <button data-tab="shorts">Shorts</button>
      <button data-tab="viral">Viral</button>
    </nav>

    <div class="header-right">
      <div class="search-bar" id="searchBar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        <input id="searchInput" placeholder="Search videos…" />
      </div>
      <button class="icon-btn" id="searchToggle" title="Search">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      </button>
    </div>
  </div>
</header>

<main>
  <div class="error-banner" id="errorBanner" style="display:none;">
    <span id="errorText"></span>
    <button data-action="retry">Retry</button>
  </div>

  <!-- ============ HOME ============ -->
  <section class="panel active" id="panel-home">
    <div class="hero" id="heroBlock">
      <div>
        <div class="hero-eyebrow">FEATURED VIDEO</div>
        <h1 class="hero-title">Stay Informed with <br>Today’s <span class="accent">Headlines</span></h1>
        <p class="hero-sub">Breaking news and in-depth coverage from around the world</p>
        <div class="subscribe-row" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
          <button class="subscribe-cta" data-action="subscribe">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a6 6 0 00-6 6v4l-2 4v1h16v-1l-2-4V8a6 6 0 00-6-6zM9.5 20a2.5 2.5 0 005 0h-5z"/></svg>
            SUBSCRIBE
          </button>
          <div id="subscribe-slot"></div>
        </div>
      </div>
      <div class="hero-video" id="heroVideo">
        <div class="loading-state" style="padding:0;"><div class="spinner"></div></div>
      </div>
    </div>

    <div class="section-head"><h2>Featured Video</h2><a class="view-all" data-action="switch-tab" data-tab="videos">View All →</a></div>
    <div class="grid large-2" id="homeLatest"><div class="loading-state"><div class="spinner"></div>Loading videos…</div></div>

    <div class="section-head"><h2>Viral Shorts</h2><a class="view-all" data-action="switch-tab" data-tab="shorts">View All Shorts →</a></div>
    <div class="shorts-scroller">
      <button class="scroll-arrow left" data-action="scroll-track" data-target="homeShortsTrack" data-dir="-1">‹</button>
      <div class="scroll-track" id="homeShortsTrack"></div>
      <button class="scroll-arrow right" data-action="scroll-track" data-target="homeShortsTrack" data-dir="1">›</button>
    </div>

    <div class="section-head"><h2>Most Viewed Videos</h2><a class="view-all" data-action="switch-tab" data-tab="videos">View All →</a></div>
    <div class="grid" id="homeMostViewed"><div class="loading-state"><div class="spinner"></div>Loading videos…</div></div>

    <div class="section-head"><h2>Most Liked Videos</h2><a class="view-all" data-action="switch-tab" data-tab="videos">View All →</a></div>
    <div class="grid" id="homeMostLiked"><div class="loading-state"><div class="spinner"></div>Loading videos…</div></div>
  </section>

  <!-- ============ SHORTS ============ -->
  <section class="panel" id="panel-shorts">
    <div class="section-head"><h2>Shorts</h2></div>
    <div class="grid shorts-grid" id="shortsGrid"><div class="loading-state"><div class="spinner"></div>Loading shorts…</div></div>
    <div class="load-more-wrap" id="shortsLoadMoreWrap" style="display:none;">
      <button class="load-more-btn" data-action="load-more-shorts">Load More</button>
    </div>
  </section>

  <!-- ============ VIDEOS ============ -->
  <section class="panel" id="panel-videos">
    <div class="section-head"><h2>Videos</h2></div>
    <div class="grid" id="videosGrid"><div class="loading-state"><div class="spinner"></div>Loading videos…</div></div>
    <div class="load-more-wrap" id="videosLoadMoreWrap" style="display:none;">
      <button class="load-more-btn" data-action="load-more-videos">Load More</button>
    </div>
  </section>

  <!-- ============ VIRAL ============ -->
  <section class="panel" id="panel-viral">
    <div class="section-head"><h2>Viral</h2></div>
    <div class="grid" id="viralGrid"><div class="loading-state"><div class="spinner"></div>Loading viral videos…</div></div>
    <div class="load-more-wrap" id="viralLoadMoreWrap" style="display:none;">
      <button class="load-more-btn" data-action="load-more-viral">Load More</button>
    </div>
  </section>

  <!-- ============ SEARCH ============ -->
  <section class="panel" id="panel-search">
    <div class="section-head"><h2>Search Results</h2></div>
    <div class="grid" id="searchGrid"></div>
  </section>
</main>

<div class="lightbox" id="lightbox">
  <div class="lightbox-inner">
    <button class="lightbox-close" data-action="close-lightbox">×</button>
    <div class="lightbox-player" id="lightboxPlayer"></div>
    <div class="lightbox-title" id="lightboxTitle"></div>
  </div>
</div>

<nav class="mobile-nav" id="mobileNav">
  <div class="row">
    <button data-tab="home" class="active">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>
      Home
    </button>
    <button data-tab="videos">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>
      Videos
    </button>
    <button data-tab="shorts">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>
      Shorts
    </button>
    <button data-tab="viral">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3-2 4-2 7a4 4 0 008 0c0-1.5-.7-2.3-1.3-3.1.6 2.3-1 3.1-1 3.1.4-2-1-3-1-5 0-1-.4-1.5-.7-2z"/><path d="M8 15a4 4 0 108 0c0-1-2-3-2-5-1.5 1-2 2.5-2 4-1 0-2 .3-2 1z"/></svg>
      Viral
    </button>
  </div>
</nav>
`

const CHANNEL_ID = 'UCJNLiW1NkgyHeoijxH-a_Wg' // The Sun Malaysia (@theSunMedia)
// Same-origin Pages Function proxy (public/_worker.js) adds the API key and an
// allowed Referer server-side.
const API_BASE = '/api/youtube'
const BATCH_SIZE = 10

export default function VideoPage() {
  const containerRef = useRef(null)

  useSeo({
    title: 'Videos - The Sun Malaysia | Latest News Videos, Shorts & Viral Clips',
    description: 'Watch the latest news videos, shorts and viral clips from The Sun Malaysia.',
    url: `${SITE_URL}/videos/`,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = VIDEO_PAGE_HTML

    const styleEl = document.createElement('style')
    styleEl.setAttribute('data-thesun-video-page', '')
    styleEl.textContent = VIDEO_PAGE_CSS
    document.head.appendChild(styleEl)

    let cancelled = false
    const $ = (id) => container.querySelector('#' + id)

    /* ---------------- state ---------------- */
    let uploadsPlaylistId = null
    let allLoadedVideos = []
    let uploadsNextToken = null
    let lastFailedFn = null
    let shortsVisible = BATCH_SIZE
    let videosVisible = BATCH_SIZE
    let viralVisible = BATCH_SIZE

    /* ---------------- subscribe button ---------------- */
    function injectSubscribeButton() {
      const slot = $('subscribe-slot')
      if (!slot) return
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.youtube.com/subscribe_embed?channelid=${CHANNEL_ID}&layout=default&count=default`
      iframe.setAttribute('scrolling', 'no')
      iframe.setAttribute('frameborder', '0')
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.setAttribute('allowtransparency', 'true')
      slot.appendChild(iframe)
    }
    function scrollToSubscribe() {
      $('subscribe-slot')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    /* ---------------- error banner ---------------- */
    function showError(msg, retryFn) {
      lastFailedFn = retryFn
      $('errorText').textContent = msg
      $('errorBanner').style.display = 'flex'
    }
    function hideError() {
      $('errorBanner').style.display = 'none'
    }
    function retryLoad() {
      hideError()
      if (lastFailedFn) lastFailedFn()
    }

    /* ---------------- fetch helpers ---------------- */
    async function ytFetch(endpoint: string, params: Record<string, any>) {
      const url = new URL(`${API_BASE}/${endpoint}`, window.location.origin)
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
      const res = await fetch(url.toString())
      const data = await res.json()
      if (!res.ok) {
        const msg = data && data.error ? data.error.message : 'Request failed'
        throw new Error(msg)
      }
      return data
    }

    function parseISODuration(iso) {
      const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!m) return 0
      const h = parseInt(m[1] || 0), mi = parseInt(m[2] || 0), s = parseInt(m[3] || 0)
      return h * 3600 + mi * 60 + s
    }
    function formatDuration(sec) {
      const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
      const pad = (n) => String(n).padStart(2, '0')
      return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
    }
    function formatViews(n) {
      n = Number(n) || 0
      if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
      if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
      return String(n)
    }
    function timeAgo(dateStr) {
      const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
      const units: [number, string][] = [[31536000, 'yr'], [2592000, 'mo'], [604800, 'wk'], [86400, 'day'], [3600, 'hr'], [60, 'min']]
      for (const [s, label] of units) {
        if (diff >= s) { const v = Math.floor(diff / s); return `${v} ${label}${v > 1 ? 's' : ''} ago` }
      }
      return 'just now'
    }

    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    }
    function escapeAttr(s) {
      return escapeHtml(s).replace(/'/g, '&#39;')
    }

    /* ---------------- renderers ---------------- */
    function videoCardHTML(v, isShort) {
      return `
      <div class="vcard ${isShort ? 'short-card' : ''}" data-video-id="${v.id}" data-video-title="${escapeAttr(v.title)}" data-is-short="${isShort ? '1' : '0'}">
        <div class="thumb-wrap">
          <img src="${v.thumb}" loading="lazy" alt="${escapeAttr(v.title)}">
          <span class="duration-badge">${v.duration}</span>
          <div class="mini-play">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="vcard-body">
          <h4>${escapeHtml(v.title)}</h4>
          <div class="vcard-meta">${formatViews(v.views)} views · ${timeAgo(v.publishedAt)}</div>
        </div>
      </div>`
    }

    function renderHome() {
      const regular = allLoadedVideos.filter((v) => !v.isShort)
      const shorts = allLoadedVideos.filter((v) => v.isShort)

      const featured = regular[0] || allLoadedVideos[0]
      if (featured) {
        const heroEl = $('heroVideo')
        heroEl.innerHTML = `
          <span class="live-badge">FEATURED</span>
          <img src="${featured.thumb}" alt="${escapeAttr(featured.title)}">
          <div class="play-circle"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div>
          <div class="watching-badge">
            <div><div class="wtitle">${escapeHtml(featured.title)}</div><div class="wsub">${formatViews(featured.views)} views</div></div>
          </div>`
        heroEl.onclick = () => openLightbox(featured.id, featured.title, false)
      }

      const latestWrap = $('homeLatest')
      latestWrap.innerHTML = regular.slice(0, 4).map((v) => videoCardHTML(v, false)).join('') || '<div class="empty-state">No videos yet.</div>'

      const track = $('homeShortsTrack')
      track.innerHTML = shorts.slice(0, 12).map((v) => videoCardHTML(v, true)).join('') || '<div class="empty-state">No shorts yet.</div>'

      const mostViewedWrap = $('homeMostViewed')
      const byViews = [...allLoadedVideos].sort((a, b) => Number(b.views) - Number(a.views))
      mostViewedWrap.innerHTML = byViews.slice(0, 8).map((v) => videoCardHTML(v, v.isShort)).join('') || '<div class="empty-state">No videos yet.</div>'

      const mostLikedWrap = $('homeMostLiked')
      const byLikes = [...allLoadedVideos].sort((a, b) => Number(b.likes) - Number(a.likes))
      mostLikedWrap.innerHTML = byLikes.slice(0, 8).map((v) => videoCardHTML(v, v.isShort)).join('') || '<div class="empty-state">No videos yet.</div>'
    }

    function renderPaginated(gridId, wrapId, items, visibleCount, isShortFn, emptyMsg) {
      const grid = $(gridId)
      const visible = items.slice(0, visibleCount)
      grid.innerHTML = visible.length ? visible.map((v) => videoCardHTML(v, isShortFn(v))).join('') : `<div class="empty-state">${emptyMsg}</div>`
      const wrap = $(wrapId)
      if (wrap) wrap.style.display = items.length > visibleCount ? 'flex' : 'none'
    }

    function renderShorts() {
      const shorts = allLoadedVideos.filter((v) => v.isShort)
      renderPaginated('shortsGrid', 'shortsLoadMoreWrap', shorts, shortsVisible, () => true, 'No shorts found.')
    }
    function renderVideos() {
      const regular = allLoadedVideos.filter((v) => !v.isShort)
      renderPaginated('videosGrid', 'videosLoadMoreWrap', regular, videosVisible, () => false, 'No videos found.')
    }
    function renderViral() {
      const byViews = [...allLoadedVideos].sort((a, b) => Number(b.views) - Number(a.views))
      renderPaginated('viralGrid', 'viralLoadMoreWrap', byViews, viralVisible, (v) => v.isShort, 'No viral videos found.')
    }

    function loadMoreTab(wrapId, applyFn) {
      const wrap = $(wrapId)
      const btn = wrap ? wrap.querySelector('.load-more-btn') : null
      const originalText = btn ? btn.textContent : ''
      if (btn) { btn.disabled = true; btn.textContent = 'Loading…' }
      setTimeout(() => {
        if (cancelled) return
        applyFn()
        const stillWrap = $(wrapId)
        const stillBtn = stillWrap ? stillWrap.querySelector('.load-more-btn') : null
        if (stillBtn) { stillBtn.disabled = false; stillBtn.textContent = originalText || 'Load More' }
      }, 400)
    }
    function loadMoreShorts() { loadMoreTab('shortsLoadMoreWrap', () => { shortsVisible += BATCH_SIZE; renderShorts() }) }
    function loadMoreVideos() { loadMoreTab('videosLoadMoreWrap', () => { videosVisible += BATCH_SIZE; renderVideos() }) }
    function loadMoreViral() { loadMoreTab('viralLoadMoreWrap', () => { viralVisible += BATCH_SIZE; renderViral() }) }

    /* ---------------- channel data loading ---------------- */
    function handleFetchError(e, retryFn) {
      showError('Could not load videos: ' + e.message, retryFn)
      ;['homeLatest', 'shortsGrid', 'videosGrid', 'viralGrid', 'homeMostViewed', 'homeMostLiked'].forEach((id) => {
        const el = $(id)
        if (el && el.querySelector('.loading-state')) el.innerHTML = '<div class="empty-state">Unable to load videos right now.</div>'
      })
    }

    async function fetchNextUploadsPage() {
      const params: Record<string, any> = { part: 'snippet', playlistId: uploadsPlaylistId, maxResults: '50' }
      if (uploadsNextToken) params.pageToken = uploadsNextToken
      const data = await ytFetch('playlistItems', params)
      uploadsNextToken = data.nextPageToken || null
      const ids = data.items.map((it) => it.snippet.resourceId.videoId).filter(Boolean)
      if (!ids.length) return []
      const details = await ytFetch('videos', { part: 'contentDetails,statistics,snippet', id: ids.join(',') })
      const newVideos = details.items.map((v) => {
        const seconds = parseISODuration(v.contentDetails.duration)
        return {
          id: v.id,
          title: v.snippet.title,
          thumb: (v.snippet.thumbnails.maxres || v.snippet.thumbnails.high || v.snippet.thumbnails.medium || v.snippet.thumbnails.default).url,
          seconds,
          duration: formatDuration(seconds),
          views: v.statistics.viewCount || 0,
          likes: v.statistics.likeCount || 0,
          publishedAt: v.snippet.publishedAt,
          isShort: seconds > 0 && seconds <= 61,
        }
      })
      allLoadedVideos = allLoadedVideos.concat(newVideos)
      return newVideos
    }

    async function loadChannelData() {
      hideError()
      try {
        if (!uploadsPlaylistId) {
          const chData = await ytFetch('channels', { part: 'contentDetails,snippet', id: CHANNEL_ID })
          if (cancelled) return
          if (!chData.items || !chData.items.length) throw new Error('Channel not found')
          uploadsPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads
        }
        await fetchNextUploadsPage()
        if (cancelled) return
        renderHome(); renderShorts(); renderVideos(); renderViral()

        while (uploadsNextToken) {
          await fetchNextUploadsPage()
          if (cancelled) return
        }
        if (cancelled) return
        renderHome(); renderShorts(); renderVideos(); renderViral()
      } catch (e) {
        if (cancelled) return
        handleFetchError(e, loadChannelData)
      }
    }

    /* ---------------- lightbox ---------------- */
    function openLightbox(id, title, isShort) {
      const player = $('lightboxPlayer')
      player.className = 'lightbox-player' + (isShort ? ' vertical' : '')
      player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
      $('lightboxTitle').textContent = title
      $('lightbox').classList.add('open')
    }
    function closeLightbox() {
      $('lightbox').classList.remove('open')
      $('lightboxPlayer').innerHTML = ''
    }

    /* ---------------- tabs ---------------- */
    function switchTab(tab) {
      container.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'))
      $('panel-' + tab).classList.add('active')
      container.querySelectorAll('nav.desktop-nav button, nav.mobile-nav button').forEach((b) => {
        b.classList.toggle('active', b.dataset.tab === tab)
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    /* ---------------- search ---------------- */
    function wireSearch() {
      const bar = $('searchBar')
      const toggle = $('searchToggle')
      const input = $('searchInput')
      const onToggle = () => {
        bar.classList.toggle('open')
        if (bar.classList.contains('open')) input.focus()
      }
      const onInput = (e) => {
        const q = e.target.value.trim().toLowerCase()
        if (!q) return
        const results = allLoadedVideos.filter((v) => v.title.toLowerCase().includes(q))
        $('searchGrid').innerHTML = results.length
          ? results.map((v) => videoCardHTML(v, v.isShort)).join('')
          : '<div class="empty-state">No videos match your search.</div>'
        switchTab('search')
      }
      toggle.addEventListener('click', onToggle)
      input.addEventListener('input', onInput)
      return () => {
        toggle.removeEventListener('click', onToggle)
        input.removeEventListener('input', onInput)
      }
    }

    /* ---------------- scroller arrows ---------------- */
    function scrollTrack(id, dir) {
      const el = $(id)
      el.scrollBy({ left: dir * 320, behavior: 'smooth' })
    }

    /* ---------------- delegated click handling (replaces inline onclick="") ---------------- */
    function handleContainerClick(e) {
      const actionEl = e.target.closest('[data-action]')
      if (actionEl) {
        const action = actionEl.dataset.action
        if (action === 'subscribe') scrollToSubscribe()
        else if (action === 'switch-tab') switchTab(actionEl.dataset.tab)
        else if (action === 'scroll-track') scrollTrack(actionEl.dataset.target, Number(actionEl.dataset.dir))
        else if (action === 'load-more-shorts') loadMoreShorts()
        else if (action === 'load-more-videos') loadMoreVideos()
        else if (action === 'load-more-viral') loadMoreViral()
        else if (action === 'retry') retryLoad()
        else if (action === 'close-lightbox') closeLightbox()
        return
      }
      const navBtn = e.target.closest('nav.desktop-nav button, nav.mobile-nav button')
      if (navBtn) { switchTab(navBtn.dataset.tab); return }

      const card = e.target.closest('.vcard')
      if (card) {
        openLightbox(card.dataset.videoId, card.dataset.videoTitle, card.dataset.isShort === '1')
        return
      }

      if (e.target.id === 'lightbox') closeLightbox()
    }

    /* ---------------- init ---------------- */
    injectSubscribeButton()
    const unwireSearch = wireSearch()
    container.addEventListener('click', handleContainerClick)
    const onKeydown = (e) => { if (e.key === 'Escape') closeLightbox() }
    document.addEventListener('keydown', onKeydown)
    loadChannelData()

    return () => {
      cancelled = true
      container.removeEventListener('click', handleContainerClick)
      document.removeEventListener('keydown', onKeydown)
      unwireSearch()
      document.head.removeChild(styleEl)
      container.innerHTML = ''
    }
  }, [])

  return <div className="thesun-video-page" ref={containerRef} style={{ minHeight: '100%' }} />
}

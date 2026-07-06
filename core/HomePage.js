import HeroManager from "./HeroManager.js";
class HomePage {
  constructor(pageViewer, root) {
    this.pageViewer = pageViewer;
    this.ScrollObserver = pageViewer.ScrollObserver;
    this.uiFactory = pageViewer.uiFactory;
    this.appServices = pageViewer.appServices;
    this.cardFactory = pageViewer.cardFactory;
    this.cardStore = pageViewer.cardStore;
    this.router = pageViewer.router;

    this.root = root;

    this._sections = [
      { endpoint: "/movie/popular", id: "popular-scroller-movies" },
      { endpoint: "/tv/popular", id: "popular-scroller-series" },
      { endpoint: "/movie/top_rated", id: "top-rated-scroller-movies" },
      { endpoint: "/tv/top_rated", id: "top-rated-scroller-series" },
      { endpoint: "/discover/movie", id: "discover-movies" },
      { endpoint: "/person/popular", id: "popular-scroller-people" },
      { endpoint: "/movie/now_playing", id: "now-playing-scroller-movies" },
      { endpoint: "/tv/airing_today", id: "airing-today-scroller-series" },
      { endpoint: "/movie/upcoming", id: "upcoming-scroller-movies" },
      { endpoint: "tv/on_the_air", id: "on-air-scroller-series" },
    ];
    this._observers = new Map();
    this._hero = null;
  }

  _renderHero() {
    if (this._hero) {
      this._hero.restart();
    } else {
      this._hero = new HeroManager(
        document.getElementById("hero-section"),
        this.appServices,
        this.pageViewer.navigateTo,
      );
    }
  }
  _renderScrollers(meta) {
    try {
      for (const section of this._sections) {
        const container = document.getElementById(section.id);
        if (!container) continue;
        const recommendationsMeta = meta?.scrollers?.[section.id] ?? null;

        const observer = new this.ScrollObserver({
          appServices: this.pageViewer.appServices,
          callback: this.pageViewer.navigateTo,
          cardFactory: this.pageViewer.cardFactory,
          cardStore: this.pageViewer.cardStore,
          container,
          endpoint: section.endpoint,
          meta: recommendationsMeta,
          pageViewer: this.pageViewer,
          errorCallback: this.scrollerErr,
        });
        container.closest(".card-container").style.display = "flex";
        this._observers.set(section.id, observer);
      }
    } catch (err) {
      this.scrollerErr(err.message);
    }
  }

  scrollerErr = (message) => {
    this.pageViewer.renderErrorFallback(this.root, message);
  };

  async createFor(data, meta = null) {
    try {
      this._renderHero();
      this._renderScrollers(meta);
      if (typeof meta?.pageScrollY === "number") {
        requestAnimationFrame(() => {
          window.scrollTo({ top: meta.pageScrollY });
        });
      }
    } catch (err) {
      console.log("inside homepage", err);
      this.hideScrollers();
      throw err;
    }
  }

  destroy() {
    this._observers.forEach((o) => o.disconnect?.());
    this._observers.clear();
    this._hero?.stop();
  }

  hideScrollers() {
    this._observers.forEach((o) => {
      o.disconnect?.();
      o.hideScroller();
    });
    this._observers.clear();
  }

  getMeta() {
    const scrollers = {};
    for (const [id, observer] of this._observers) {
      if (typeof observer.getMeta === "function") {
        scrollers[id] = observer.getMeta();
      }
    }
    return {
      pageScrollY: window.scrollY,
      scrollers,
    };
  }
}
export default HomePage;

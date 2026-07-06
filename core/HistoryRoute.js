class HistoryRouter {
  get current() {
    return this._currentRoute;
  }

  constructor() {
    this._routes = new Map();
    this._pageMap = new Map([
      ["home", "home-page"],
      ["company", "detail-page"],
      ["movie", "detail-page"],
      ["tv", "detail-page"],
      ["person", "detail-page"],
      ["search", "search-page"],
      ["watchlist", "watchlist-page"],
    ]);
    this._currentRoute = null;
    this._onPopState = this._dispatch.bind(this);
  }

  _dispatch() {
    const parsed = this._parseHash();
    parsed.meta = window.history.state;
    const { id, meta, params, query, route, subId, subRoute } = parsed;

    if (!this._pageMap.has(route)) {
      location.hash = "#home";
      return;
    }

    const pageId = this._pageMap.get(route);

    if (!this._currentRoute || this._currentRoute.route !== route) {
      this._hideAll();
      window.scroll({ behavior: "smooth", left: 0, top: 0 });
      this._show(pageId);
    }

    this._currentRoute = parsed;
    const handler = this._routes.get(route);

    if (handler) handler({ id, meta, params, query, subId, subRoute });
  }

  _hideAll() {
    document.querySelectorAll(".page").forEach((el) => {
      el.style.display = "none";
    });
  }

  _parseHash() {
    const raw = location.hash.slice(1);
    if (!raw) return { id: null, params: {}, query: null, route: "home" };

    const [pathPart, queryPart] = raw.split("?");
    const segments = pathPart.split("/");

    const route = segments[0] || "home";
    const id = segments[1] ?? null;
    const subRoute = segments[2] ?? null;
    const subId = segments[3] ?? null;

    const params = {};
    if (queryPart) {
      queryPart.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        if (k) params[k] = decodeURIComponent(v ?? "");
      });
    }

    return {
      id,
      params,
      query: params.q ?? null,
      route,
      subId,
      subRoute,
    };
  }

  _show(pageId) {
    const el = document.getElementById(pageId);
    if (el) el.style.display = "block";
  }

  back() {
    history.back();
  }

  destroy() {
    window.removeEventListener("popstate", this._onPopState);
  }

  forward() {
    history.forward();
  }

  init() {
    window.addEventListener("popstate", this._onPopState);
    if (!location.hash || location.hash === "#") {
      this.navigate("#home");
    } else {
      this._dispatch();
    }
  }

  navigate(hash, meta = null) {
    window.history.pushState(meta, "", hash);
    this._dispatch();
  }

  navigateSilent(meta = null) {
    const parsed = this._parseHash();
    parsed.meta = meta;
    window.history.replaceState(meta, "", location.hash);
    this._currentRoute = parsed;
  }

  register(route, handler) {
    this._routes.set(route, handler);
    return this;
  }
}

const historyRouter = new HistoryRouter();
export default historyRouter;

export default class ScrollObserver {
  constructor(config) {
    this.container = config.container;
    this.endpoint = config.endpoint;
    this.services = config.appServices;
    this.cardStore = config.cardStore;
    this.cardFactory = config.cardFactory;
    this.pageViewer = config.pageViewer;
    this.direction = config.direction ?? "horizontal";
    this.init = config.recommendations;
    this._loadByPreference = config.meta ?? false;
    this.params = config.params ?? {};

    this.pageKeys = new Map();
    this.cardIds = new Map();
    this.state = {
      page: config.page ?? 1,
      hasMore: true,
      loading: false,
      minPage: config.page ?? 1,
      maxPage: config.page ?? 1,
    };

    this.order = [];
    this._scrollThreshold = config.scrollThreshold ?? 120;
    this._navButtons = {};
    this._scrollThrottler = null;
    this._throttledScroll = null;
    this.errorCallback = config.errorCallback ?? null;
    this._init();
    this._initNavigation();
  }

  _init = () => {
    this._throttledScroll = this.throttle(this._onScroll, 120);
    this.container.addEventListener("scroll", this._throttledScroll);
    this.container.innerHTML = "";

    try {
      if (this._loadByPreference) {
        return this.restore(this._loadByPreference);
      }

      if (this.init?.length) {
        this._loadRecommendation(this.init);
        this.state.page = 2;
        this.state.minPage = 1;
        this.state.maxPage = 1;
        return;
      }

      this._loadMore();
    } catch (err) {
      this._handleError(err);
    }
  };
  _initNavigation() {
    const wrapper = this.container.parentElement;
    if (wrapper) {
      wrapper.style.position = "relative";
    }

    if (this.direction === "horizontal") {
      this._createNavButton("prev", "‹", "horizontal-nav prev");
      this._createNavButton("next", "›", "horizontal-nav next");
    } else {
      this._createNavButton("top", "▲", "vertical-nav top");
      this._createNavButton("bottom", "▼", "vertical-nav bottom");
    }

    this._onScrollHandler = this._evaluateButtonVisibility.bind(this);
    this.container.addEventListener("scroll", this._onScrollHandler, {
      passive: true,
    });

    this._evaluateButtonVisibility();
  }

  _createNavButton(key, text, classNames) {
    const btn = document.createElement("button");
    btn.className = `scroll-nav-btn ${classNames}`;
    btn.innerHTML = text;
    btn.setAttribute("aria-label", `Scroll ${key}`);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      this._handleNavClick(key);
    });

    if (this.container.parentElement) {
      this.container.parentElement.appendChild(btn);
      this._navButtons[key] = btn;
    }
  }

  _evaluateButtonVisibility() {
    if (this._scrollThrottler) return;

    this._scrollThrottler = requestAnimationFrame(() => {
      const {
        scrollLeft,
        scrollWidth,
        clientWidth,
        scrollTop,
        scrollHeight,
        clientHeight,
      } = this.container;
      const buffer = 15;
      const apiHasMoreData =
        typeof this.hasMore === "boolean" ? this.hasMore : true;

      if (this.direction === "horizontal") {
        if (this._navButtons.prev) {
          this._navButtons.prev.classList.toggle(
            "visible",
            scrollLeft > buffer,
          );
        }
        if (this._navButtons.next) {
          const isAtCurrentDOMEnd =
            scrollLeft + clientWidth >= scrollWidth - buffer;

          const shouldHideNext = isAtCurrentDOMEnd && !apiHasMoreData;
          this._navButtons.next.classList.toggle("visible", !shouldHideNext);
        }
      } else {
        if (this._navButtons.top) {
          this._navButtons.top.classList.toggle("visible", scrollTop > 300);
        }
        if (this._navButtons.bottom) {
          const isAtCurrentDOMBottom =
            scrollTop + clientHeight >= scrollHeight - buffer;

          const shouldHideBottom = isAtCurrentDOMBottom && !apiHasMoreData;
          this._navButtons.bottom.classList.toggle(
            "visible",
            !shouldHideBottom,
          );
        }
      }

      this._scrollThrottler = null;
    });
  }

  /**
   * Handles navigation jumps, pushing forced fetches if stuck at temporary DOM walls
   */
  _handleNavClick(key) {
    const isHorizontal = this.direction === "horizontal";
    const jumpSize = isHorizontal
      ? this.container.clientWidth * 0.8
      : this.container.clientHeight * 0.8;
    const buffer = 15;

    if (key === "prev") {
      this.container.scrollBy({ left: -jumpSize, behavior: "smooth" });
    } else if (key === "top") {
      this.container.scrollTo({ top: jumpSize, behavior: "smooth" });
    } else if (key === "next") {
      const isAtEdge =
        this.container.scrollLeft + this.container.clientWidth >=
        this.container.scrollWidth - buffer;
      if (
        isAtEdge &&
        this.hasMore &&
        typeof this.fetchNextPage === "function"
      ) {
        this.fetchNextPage();
      } else {
        this.container.scrollBy({ left: jumpSize, behavior: "smooth" });
      }
    } else if (key === "bottom") {
      const isAtBottom =
        this.container.scrollTop + this.container.clientHeight >=
        this.container.scrollHeight - buffer;
      if (
        isAtBottom &&
        this.hasMore &&
        typeof this.fetchNextPage === "function"
      ) {
        this.fetchNextPage();
      } else {
        this.container.scrollBy({ top: jumpSize, behavior: "smooth" });
      }
    }
  }

  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  _onScroll = () => {
    if (this.state.loading) return;

    const {
      scrollLeft,
      scrollWidth,
      clientWidth,
      scrollTop,
      scrollHeight,
      clientHeight,
    } = this.container;

    const isHorizontal = this.direction === "horizontal";
    const leading = isHorizontal ? scrollLeft : scrollTop;
    const trailing = isHorizontal
      ? scrollLeft + clientWidth
      : scrollTop + clientHeight;
    const total = isHorizontal ? scrollWidth : scrollHeight;

    if (leading <= this._scrollThreshold && this.state.minPage > 1) {
      this._loadPrevious();
      return;
    }

    if (trailing >= total - this._scrollThreshold) {
      if (!this.state.hasMore) return;
      this._loadMore();
    }
  };

  _loadMore = async () => {
    if (this.state.loading) return;
    this.state.loading = true;
    const page = this.state.page;
    const pageKey = this._getPageKey(page);
    this.pageKeys.set(pageKey, page);

    try {
      const cachedIds = this.cardStore.getPage(pageKey);
      if (cachedIds?.length) {
        this._appendCardsByIds(cachedIds);
        this.state.maxPage = page;
        this.state.page = page + 1;
        return;
      }

      const cards = await this.services.listOfEndPoint(this.endpoint, {
        page,
        ...this.params,
      });

      if (!cards?.length) {
        this.state.hasMore = false;
        throw new Error("cards ended");
        return;
      }

      this.cardStore.setPage(pageKey, cards);
      this._appendCardsByIds(cards.map((c) => c.id));
      this.state.maxPage = page;
      this.state.page = page + 1;
    } catch (err) {
      this._handleError(err);
    } finally {
      this.state.loading = false;
    }
  };

  _loadPrevious = async () => {
    if (this.state.loading) return;
    const previousPage = this.state.minPage - 1;
    if (previousPage < 1) return;

    this.state.loading = true;
    const pageKey = this._getPageKey(previousPage);
    this.pageKeys.set(pageKey, previousPage);

    try {
      const cachedIds = this.cardStore.getPage(pageKey);
      if (cachedIds?.length) {
        this._prependCardsByIds(cachedIds);
        this.state.minPage = previousPage;
        return;
      }

      const cards = await this.services.listOfEndPoint(this.endpoint, {
        page: previousPage,
        ...this.params,
      });

      if (!cards?.length) return;

      this.cardStore.setPage(pageKey, cards);
      this._prependCardsByIds(cards.map((c) => c.id));
      this.state.minPage = previousPage;
    } catch (err) {
      this._handleError(err);
    } finally {
      this.state.loading = false;
    }
  };

  _loadRecommendation = (recommendation = []) => {
    if (!recommendation?.length) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < recommendation.length; i++) {
      const id = recommendation[i];

      if (this.cardIds.has(id)) continue;
      this.cardIds.set(id, null);

      const card = this.cardFactory.buildCard(this.cardStore.get(id));
      if (!card) continue;
      frag.appendChild(card);
      this.order.push(id);
    }
    this.container.appendChild(frag);
  };

  _appendCardsByIds = (cardIds) => {
    if (!cardIds?.length) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < cardIds.length; i++) {
      const id = cardIds[i];
      if (this.cardIds.has(id)) continue;
      this.cardIds.set(id, null);

      const card = this.cardFactory.buildCard(this.cardStore.get(id));
      if (!card) continue;
      frag.appendChild(card);
      this.order.push(id);
    }
    this.container.appendChild(frag);
  };

  _prependCardsByIds = (cardIds) => {
    if (!cardIds?.length) return;
    const prevScrollWidth = this.container.scrollWidth;
    const prevScrollHeight = this.container.scrollHeight;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < cardIds.length; i++) {
      const id = cardIds[i];
      if (this.cardIds.has(id)) continue;
      this.cardIds.set(id, null);

      const card = this.cardFactory.buildCard(this.cardStore.get(id));

      if (!card) continue;
      frag.appendChild(card);
      this.order.unshift(id);
    }
    this.container.insertBefore(frag, this.container.firstChild);

    if (this.direction === "horizontal") {
      this.container.scrollLeft += this.container.scrollWidth - prevScrollWidth;
    } else {
      this.container.scrollTop +=
        this.container.scrollHeight - prevScrollHeight;
    }
  };

  _getPageKey = (page) => `${this.endpoint}::page=${page}`;

  restore = async (meta) => {
    if (!meta) return;

    this.state.loading = true;

    const startPage = meta.minPage ?? 1;
    const endPage = meta.maxPage ?? 1;

    try {
      for (let page = startPage; page <= endPage; page++) {
        await this._loadPageInOrder(page);
      }
    } catch (err) {
      this._handleError(err);
      this.state.loading = false;
      return;
    }

    this.state.minPage = startPage;
    this.state.maxPage = endPage;
    this.state.page = endPage + 1;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.direction === "horizontal") {
          this.container.scrollLeft = meta.scrollPosition;
        } else {
          this.container.scrollTop = meta.scrollPosition;
        }

        setTimeout(() => {
          this.state.loading = false;
        }, 100);
      });
    });
  };

  _loadPageInOrder = async (page) => {
    const pageKey = this._getPageKey(page);
    this.pageKeys.set(pageKey, page);

    const cachedIds = this.cardStore.getPage(pageKey);
    if (cachedIds?.length) {
      this._appendCardsByIds(cachedIds);
      return;
    }

    const cards = await this.services.listOfEndPoint(this.endpoint, {
      page,
      ...this.params,
    });
    if (!cards?.length) return;

    this.cardStore.setPage(pageKey, cards);
    this._appendCardsByIds(cards.map((c) => c.id));
  };

  hideScroller = () => this._handleError(null, true);

  _handleError = (error, externalCall) => {
    this.state.hasMore = false;
    if (this.container.children.length === 0) {
      const cardContainer = this.container.closest(".card-container");
      if (cardContainer) {
        cardContainer.style.display = "none";
      }
    }
    if (externalCall) return;
    typeof this.errorCallback === "function" &&
      this.errorCallback(error.message);
  };

  getMeta = () => ({
    minPage: this.state.minPage,
    maxPage: this.state.maxPage,
    scrollPosition: Math.round(
      this.direction === "horizontal"
        ? this.container.scrollLeft
        : this.container.scrollTop,
    ),
    endpoint: this.endpoint,
    direction: this.direction,
    params: this.params,
  });

  disconnect = () => {
    if (this._throttledScroll) {
      this.container.removeEventListener("scroll", this._throttledScroll);
    }
    this.pageKeys.forEach((page, pageKey) => {
      this.cardStore.deletePage(pageKey);
    });

    this.pageKeys.clear();
    this.cardIds.clear();
    if (this._onScrollHandler) {
      this.container.removeEventListener("scroll", this._onScrollHandler);
    }

    cancelAnimationFrame(this._scrollThrottler);
    Object.values(this._navButtons).forEach((btn) => {
      if (btn && btn.parentNode) {
        btn.parentNode.removeChild(btn);
      }
    });

    this._navButtons = {};
    this.container.innerHTML = "";
  };
}

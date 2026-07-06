import MoviePage from "./MoviePage.js";
import TvPage from "./TvPage.js";
import HomePage from "./HomePage.js";
import UiFactory from "./UiFactory.js";
import ScrollObserver from "./ScrollObserver.js";
import CastPage from "./CastPage.js";
import CompanyPage from "./CompanyPage.js";
import SeasonPage from "./SeasonPage.js";
import EpisodePage from "./EpisodePage.js";
import SearchPage from "./SearchPage.js";
import watchListPage from "./WatchListPage.js";
import dataHandler from "./DataHandler.js";

const ERROR_CONFIGS = {
  network: {
    imagePath: "./assets/error/network.svg",
    heading: "The signal got lost on its way here.",
    subtext: "We're having trouble reaching our servers.",
    text: "Please check your connection and try again.",
    homeMessage: "Network disconnected. Please check your internet connection.",
  },
  generic: {
    imagePath: "./assets/error/missing.svg",
    heading: "The Scene seems to be missing.",
    subtext: "We searched every frame but couldn't find",
    text: "what you 're looking for",
    homeMessage: "An unexpected error occurred. Please refresh the page.",
  },
};

export default class PageViewManager {
  constructor(config) {
    this.root = config.root;
    this.appServices = config.appServices;
    this.cardStore = config.cardStore;
    this.cardFactory = config.cardFactory;
    this.router = config.router;
    this.ScrollObserver = ScrollObserver;
    this.uiFactory = new UiFactory(this, ScrollObserver);
    this.dataHandler = dataHandler;

    this.pages = {
      watchlist: document.getElementById("watchlist-page"),
      detail: document.getElementById("detail-page"),
      home: document.getElementById("home-page"),
      search: document.getElementById("search-page"),
    };

    this.homePage = new HomePage(this, this.pages.home);
    this.moviePage = new MoviePage(this, this.pages.detail);
    this.tvPage = new TvPage(this, this.pages.detail);
    this.castPage = new CastPage(this, this.pages.detail);
    this.companyPage = new CompanyPage(this, this.pages.detail);
    this.seasonPage = new SeasonPage(this, this.pages.detail);
    this.episodePage = new EpisodePage(this, this.pages.detail);
    this.searchPage = new SearchPage(this, this.pages.search);
    this.watchListPage = watchListPage;

    this.backBtn = document.getElementById("global-back-btn");
    this.homeBtn = document.getElementById("home-btn");
    this.searchBtn = document.getElementById("search-btn");
    this.watchListBtn = document.getElementById("watchlist-btn");
    this.footer = document.getElementById("footer");
    this.loader =
      document.getElementById("global-loader") || this._createGlobalLoader();

    this.currentPage = null;

    window.addEventListener("online", () => {
      this.reconnect();
    });

    this.backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.goBack();
    });

    this.homeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.navigateTo(`#home`);
    });

    this.watchListBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.navigateTo(`#watchlist`);
    });

    this.searchBtn.addEventListener("click", () => {
      const currentRoute = this.router.current?.route;
      const tab =
        currentRoute === "movie" || currentRoute === "tv"
          ? currentRoute
          : "all";
      this.navigateTo(`#search?tab=${tab}`);
    });
  }

  _preparePageTransition(targetPage, targetPageKey) {
    this._hideHorizontalMessage();
    this.showLoader();
    if (this.currentPage && typeof this.currentPage.destroy === "function") {
      this.currentPage.destroy();
    }
    this.currentPage = targetPage;
    window.scroll({ behavior: "smooth", left: 0, top: 0 });
  }

  clearRoot = (key) => {
    const el = this.pages[key];
    if (el) {
      el.innerHTML = "";
      el.meta = "";
    }
  };

  _createGlobalLoader() {
    const loader = document.createElement("div");
    loader.id = "global-loader";
    loader.className = "global-transition-loader";
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
    return loader;
  }

  showLoader = () => {
    if (this.loader) this.loader.classList.add("active");
  };

  hideLoader = () => {
    if (this.loader)
      setTimeout(() => {
        this.loader.classList.remove("active");
      }, 600);
  };

  goBack = () => {
    this.router.back();
  };

  showElement = (element) => {
    if (element && element.style) {
      element.style.display = "block";
    }
  };

  hideElement = (element) => {
    if (element && element.style) {
      element.style.display = "none";
    }
  };

  async loadDetails(id, category, meta = null) {
    const categoryMap = {
      movie: this.moviePage,
      tv: this.tvPage,
      person: this.castPage,
      company: this.companyPage,
    };

    const targetPage = categoryMap[category];
    if (!targetPage) return;

    this._preparePageTransition(targetPage, "detail");

    try {
      const data = await this.appServices.detailsOf(id, category);

      if (data?.message) {
        throw new Error(data.message);
      }

      targetPage.createFor(data, meta);

      this.hideElement(this.footer);

      this.showElement(this.searchBtn);
      this.showElement(this.watchListBtn);
      this.showElement(this.homeBtn);
      this.showElement(this.backBtn);

      if (typeof this.currentPage.destroy === "function")
        this.homePage.destroy();
    } catch (err) {
      console.error("Failed to load details page context:", err);
      this.renderErrorFallback(targetPage.root, err.message);
    } finally {
      this.hideLoader();
    }
  }

  async loadEpisodeDetails(seriesId, seasonNumber, episodeNumber, meta = null) {
    this._preparePageTransition(this.episodePage, "detail");
    let errorMessage = "";

    try {
      const data = await this.appServices.detailsForEpisode(
        `tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
      );

      if (data?.message) {
        errorMessage = data.message;
        throw new Error(data.message);
      }

      this.episodePage.createFor(data, meta);

      this.showElement(this.backBtn);
    } catch (err) {
      console.error("Failed to load episode context:", err);
      this.renderErrorFallback(this.episodePage.root, err.message);
    } finally {
      this.hideLoader();
    }
  }

  async loadHome(id, meta = null) {
    this._preparePageTransition(this.homePage, "home");

    try {
      await this.homePage.createFor(null, meta);

      this.hideElement(this.backBtn);
      this.hideElement(this.homeBtn);
      this.showElement(this.searchBtn);
      this.showElement(this.watchListBtn);

      this.showElement(this.footer);
    } catch (err) {
      console.error("inside pager");
      this.renderErrorFallback(this.homePage.root, err.message);
    } finally {
      this.hideLoader();
    }
  }

  loadSearch(params, meta) {
    this._preparePageTransition(this.searchPage, "search");
    try {
      this.searchPage.createFor(params, meta);

      this.hideElement(this.footer);

      this.showElement(this.backBtn);
      this.showElement(this.homeBtn);
      this.hideElement(this.searchBtn);
      this.showElement(this.watchListBtn);
    } catch (err) {
      console.error("Search construction structural error:", err);
      this.renderErrorFallback(this.searchPage.root, err.message);
    } finally {
      this.hideLoader();
    }
  }
  loadWatchlist() {
    try {
      this._preparePageTransition(this.watchListPage, "watchlist");
      this.watchListPage.renderView();
      this.hideElement(this.footer);

      this.hideElement(this.watchListBtn);

      this.showElement(this.homeBtn);
      this.showElement(this.backBtn);
      this.showElement(this.searchBtn);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
      this.renderErrorFallback(this.watchListPage.root, err.message);
    } finally {
      this.hideLoader();
    }
  }

  async loadSeasonDetails(seriesId, seasonNumber, meta = {}) {
    this._preparePageTransition(this.seasonPage, "detail");

    try {
      const data = await this.appServices.detailsForSeason(
        `tv/${seriesId}/season/${seasonNumber}`,
      );

      if (data?.message) {
        throw new Error(data.message);
      }

      this.seasonPage.createFor(data, meta);
      this.hideElement(this.footer);

      this.showElement(this.homeBtn);
      this.showElement(this.backBtn);
    } catch (err) {
      this.renderErrorFallback(this.seasonPage.root, err.message);
    } finally {
      this.hideLoader();
    }
  }

  navigateTo = (hash, meta = null) => {
    if (this.currentPage && typeof this.currentPage.getMeta === "function") {
      const currentMeta = this.currentPage.getMeta();
      this.router.navigateSilent(currentMeta);
    }
    this.router.navigate(hash, meta);
  };

  _renderHorizontalMessage(message) {
    let container = document.getElementById("horizontal-error-msg");
    if (!container) return;
    container.textContent = message;
    this.showElement(container);
  }

  _hideHorizontalMessage() {
    const container = document.getElementById("horizontal-error-msg");
    if (!container) return;
    this.hideElement(container);
    container.textContent = "";
  }

  reconnect() {
    this._hideHorizontalMessage();
    if (this.currentPage === this.homePage) {
      this.loadHome();
    }
  }

  renderErrorFallback = (rootElement, errorString) => {
    const isNetworkError = this._isNetworkError(errorString);
    const errorContent = this._getErrorContent(isNetworkError);

    if (this.currentPage === this.homePage) {
      this._handleHomePageError(errorContent.homeMessage);
      return;
    }

    if (!rootElement) return;
    rootElement.innerHTML = this._getHTMLTemplate(errorContent);
  };

  _isNetworkError(errorString) {
    if (!errorString) return false;
    const lowerError = errorString.toLowerCase();
    return ["fetch", "network", "timed out"].some((keyword) =>
      lowerError.includes(keyword),
    );
  }

  _getErrorContent(isNetworkError) {
    return isNetworkError ? ERROR_CONFIGS.network : ERROR_CONFIGS.generic;
  }

  _handleHomePageError(message) {
    this.homePage.hideScrollers();
    this._renderHorizontalMessage(message);
  }

  _getHTMLTemplate({ imagePath, heading, subtext, text }) {
    return `
      <div class="err-message glass-heavy">
        <img class="error-svg" src="${imagePath}">
        <p class="error-heading">${heading}</p>
        <p class="error-subtext">${subtext}</p>
        <p class="error-text">${text}</p>
        <button><a href="#home">Back to Home</a></button>
      </div>
    `;
  }
}

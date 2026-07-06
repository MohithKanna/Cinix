import AppService from "./core/AppService.js";
import cardStore from "./core/CardStore.js";
import cardFactory from "./core/CardFactory.js";
import ScrollObserver from "./core/ScrollObserver.js";
import PageViewManager from "./core/PageViewManager.js";
import historyRouter from "./core/HistoryRoute.js";
import watchListPage from "./core/WatchListPage.js";
import HeroManager from "./core/HeroManager.js";

if (navigator.userAgent.toLowerCase().includes("firefox")) {
  document.documentElement.classList.add("is-firefox");
}
const appServices = new AppService({ cardStore });
await appServices.setup();

const router = historyRouter;
const root = document.getElementById("main-page");
const hamburger = document.getElementById("hamburger");
const navOptions = document.getElementById("nav-options");

const pageViewManager = new PageViewManager({
  root,
  appServices,
  cardStore,
  cardFactory,
  router,
});

router
  .register("movie", ({ id, meta }) => {
    pageViewManager.loadDetails(id, "movie", meta);
  })
  .register("tv", ({ id, meta, subRoute, subId, params }) => {
    if (subRoute === "season" && subId && params.episode) {
      pageViewManager.loadEpisodeDetails(id, subId, params.episode, meta);
    } else if (subRoute === "season" && subId) {
      pageViewManager.loadSeasonDetails(id, subId, meta);
    } else {
      pageViewManager.loadDetails(id, "tv", meta);
    }
  })
  .register("person", ({ id, meta }) => {
    pageViewManager.loadDetails(id, "person", meta);
  })
  .register("home", ({ meta }) => {
    pageViewManager.loadHome(null, meta);
  })
  .register("company", ({ id, meta }) => {
    pageViewManager.loadDetails(id, "company", meta);
  })
  .register("search", ({ params, meta }) => {
    pageViewManager.loadSearch(params, meta);
  })
  .register("watchlist", () => {
    pageViewManager.loadWatchlist();
  });
router.init();

document.addEventListener("click", (e) => {
  e.stopPropagation();
  const target = e.target;

  if (target.closest(".logo-img")) {
    return router.navigate("#home");
  }
  if (target.closest("#hamburger")) {
    hamburger.classList.toggle("open");
    navOptions.classList.toggle("open");
    return;
  }
  if (target.closest(".nav-btn")) {
    hamburger.classList.remove("open");
    navOptions.classList.remove("open");
    return;
  }

  const cardIcon = target.closest(".card-icon");
  if (cardIcon) {
    const card = target.closest("[data-id][data-type]");
    if (card) watchListPage.processCardElement(card);
    const isBookmarked = cardIcon.dataset.inbookmark === "in";
    cardIcon.dataset.inbookmark = isBookmarked ? "out" : "in";
    cardIcon.src = `./assets/icons/${isBookmarked ? "add" : "checked"}-bookmark.svg`;
    return;
  }

  const genreChip = target.closest(".chip-watchlist");
  if (genreChip) {
    const page = target.closest(".page");
    if (page.meta) {
      const result = watchListPage.processPage(page.meta);
      genreChip.textContent = `${result ? "✓" : "+"} Watchlist`;
    }
  }

  const genreTag = target.closest(".chip-genre, .genre");
  if (genreTag) {
    const { genreId, genreType } = genreTag.dataset;
    if (genreId && genreType) {
      pageViewManager.navigateTo(`#search?tab=${genreType}&genre=${genreId}`);
    }
    return;
  }

  const episodeCard = target.closest(
    "[data-series-id][data-season-number][data-episode-number]",
  );
  if (episodeCard) {
    const { seriesId, seasonNumber, episodeNumber } = episodeCard.dataset;
    return pageViewManager.navigateTo(
      `#tv/${seriesId}/season/${seasonNumber}?episode=${episodeNumber}`,
    );
  }

  const seasonCard = target.closest(
    "[data-type][data-series-id][data-season-number]",
  );
  if (seasonCard) {
    const { type, seriesId, seasonNumber } = seasonCard.dataset;
    return pageViewManager.navigateTo(
      `#${type}/${seriesId}/season/${seasonNumber}`,
    );
  }

  const card = target.closest("[data-id][data-type]");
  if (card) {
    pageViewManager.navigateTo(`#${card.dataset.type}/${card.dataset.id}`);
  }
});

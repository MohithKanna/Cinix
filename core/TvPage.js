import watchListPage from "./WatchListPage.js";
class TvPage {
  constructor(pageViewer, root) {
    this.pageViewer = pageViewer;
    this.root = root;
    this.ui = pageViewer.uiFactory;
    this._scrollers = {};
  }

  _createHeroSection(data) {
    const hero = this.ui.el("div", "detail-hero-section");
    const img = this.ui.el("img", "detail-hero-poster");

    img.alt = "tv_poster";
    img.src = data.poster || "assets/defaults/default-poster-portrait.png";
    hero.appendChild(img);

    const div = this.ui.el("div", "primary-details");
    this.ui.createTitleBlock(div, data.title, data.tagline);

    const chipsRow = this.ui.createFlexRow(div);

    if (data.rating) {
      this.ui.addChip(
        chipsRow,
        `★ ${data.rating.toFixed(1)}`,
        "rating",
        data.rating,
      );
    }
    if (this.root.meta !== "") {
      if (watchListPage.has(data.id)) {
        this.ui.addChip(chipsRow, `✓  Watchlist `, "watchlist", data.rating);
      } else {
        this.ui.addChip(chipsRow, `+ Watchlist`, "watchlist", data.rating);
      }
    }
    if (Array.isArray(data.genres)) {
      data.genres.forEach((g) => {
        const chip = this.ui.addChip(chipsRow, g.name, "genre");
        chip.dataset.genreId = g?.id ?? null;
        chip.dataset.genreType = data?.type ?? null;
      });
    }

    if (data.adult) this.ui.addChip(chipsRow, "ADULT", "cutout");
    if (data.softcore) this.ui.addChip(chipsRow, "SOFTCORE", "cutout");

    const viewerSegment = data.count
      ? `${data.rating || 0}/10 over ${data.count}+ viewers`
      : "";
    const popularitySegment = data.popularity
      ? `Popularity: ${Number(data.popularity).toLocaleString()}`
      : "";

    const statsString = [viewerSegment, popularitySegment]
      .filter(Boolean)
      .join(" • ");

    this.ui.addMicroStatsLine(div, statsString);
    this.ui.addSectionOverview(div, "overview", data.overview);

    const metaChipsRow = this.ui.createFlexRow(div);
    metaChipsRow.classList.add("meta-facts-container-row");
    this.ui.addMetaFactChip(metaChipsRow, "Language:", data.ogLang);

    this.ui.addMetaFactChip(metaChipsRow, "Status:", data.status);
    this.ui.addMetaFactChip(metaChipsRow, "Released:", data.releaseDate);
    this.ui.addMetaFactChip(metaChipsRow, "Duration:", data.runtime);
    this.ui.addFinancialsLine(div, data.budget, data.revenue);

    if (data.countries && data.countries.length > 0) {
      const countryString = data.countries.map((c) => c.name || c).join(", ");
      this.ui.addTextLine(div, "Countries", countryString);
    }
    if (data.languages && data.languages.length > 0) {
      const languageSting = data.languages
        .map((c) => c || null)
        .filter(Boolean)
        .join(", ");
      this.ui.addTextLine(div, "Languages", languageSting);
    }
    this.ui.createMoreLink(div, data.homepage);

    hero.appendChild(div);
    this.root.appendChild(hero);
  }

  _createSeasonsSection(seasons = [], id) {
    const { scroller, section } = this.ui.createScrollSection("Seasons");

    seasons.forEach((season) => {
      if (!season?.name) return;

      const card = this.ui.scrollCard(["card", "glass"]);
      card.dataset.type = "tv";
      card.dataset.seriesId = id;
      card.dataset.seasonNumber = season?.seasonNumber;

      const media = this.ui.el("div", "card-media");

      const img = this.ui.memberImg(
        season.url || "assets/defaults/season.png",
        season.name,
        ["card-img"],
      );
      const label = this.ui.el("span", "card-title");
      const title = this.ui.cardLabel(season.name, ["card-details"]);

      label.append(title);
      media.append(img);
      card.append(media, label);
      scroller.appendChild(card);
    });

    section.appendChild(scroller);
    this.root.appendChild(section);
  }

  createFor(data, meta = null) {
    if (!data) return;

    this.pageViewer.clearRoot("detail");
    this.root.meta = JSON.stringify(data.meta);
    this._createHeroSection(data);

    if (data.backdrops?.length)
      this.ui.createBackdrops(this.root, data.backdrops);

    if (data.seasons?.length) this._createSeasonsSection(data.seasons, data.id);

    if (data.videos?.length) this.ui.createVideoSection(this.root, data.videos);

    if (data.credits?.length)
      this.ui.createCastSection(this.root, data.credits);

    if (data.recommendations) {
      const recommendationsMeta = meta?.scrollers?.recommendations ?? null;
      const recObserver = this.ui.createRecommendation(
        this.root,
        data,
        recommendationsMeta,
      );

      this._scrollers["recommendations"] = recObserver;
    }

    if (data.companies?.length)
      this.ui.createCompanySection(this.root, data.companies);

    if (typeof meta?.pageScrollY === "number") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: meta.pageScrollY });
      });
    }
  }
  getMeta = () => {
    const scrollerMetadata = {};
    Object.keys(this._scrollers).forEach((key) => {
      if (
        this._scrollers[key] &&
        typeof this._scrollers[key].getMeta === "function"
      ) {
        scrollerMetadata[key] = this._scrollers[key].getMeta();
      }
    });

    return {
      __fromHash: location.hash,
      scrollers: scrollerMetadata,
      scrollY: window.scrollY,
    };
  };
}
export default TvPage;

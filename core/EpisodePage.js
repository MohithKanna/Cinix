class EpisodePage {
  constructor(pageViewer, root) {
    this.pageViewer = pageViewer;
    this.ui = pageViewer.uiFactory;
    this.root = root;
  }

  _createEpisodeMeta(parent, data = {}) {
    const metaChipsRow = this.ui.createFlexRow(parent);
    metaChipsRow.classList.add("meta-facts-container-row");

    this.ui.addChip(
      metaChipsRow,
      `★ ${data.rating.toFixed(1)}`,
      "rating",
      data.rating,
    );
    this.ui.addMetaFactChip(metaChipsRow, "Type:", data.episodeType);
    this.ui.addMetaFactChip(metaChipsRow, "Episode:", data.episodeNumber);
    this.ui.addMetaFactChip(metaChipsRow, "Season:", data.seasonNumber);
    this.ui.addMetaFactChip(metaChipsRow, "Runtime:", data.runtime);
  }

  _createHeroSection(data) {
    const hero = this.ui.el("div", "detail-hero-section");

    const img = this.ui.el("img", "detail-hero-poster-landscape");
    img.alt = data.title || "episode_still";
    img.src = data.still || "assets/defaults/default-poster-portrait.png";
    hero.appendChild(img);

    const div = this.ui.el("div", ["primary-details", "glass"]);
    this.ui.createTitleBlock(div, data.title, data.tagline);

    this._createEpisodeMeta(div, data);

    if (data.overview)
      this.ui.addSectionOverview(div, "overview", data.overview);

    hero.appendChild(div);
    this.root.appendChild(hero);
  }

  createFor(data, meta = null) {
    if (!data) return;

    this.pageViewer.clearRoot("detail");
    this._createHeroSection(data);
    if (data.backdrops?.length)
      this.ui.createBackdrops(this.root, data.backdrops);
    if (data.castAndcrew?.length)
      this.ui.createCastSection(this.root, data.castAndcrew);
  }
}

export default EpisodePage;

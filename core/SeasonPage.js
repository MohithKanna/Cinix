class SeasonPage {
  constructor(pageViewer, root) {
    this.pageViewer = pageViewer;
    this.ui = pageViewer.uiFactory;
    this.root = root;
  }

  createFor(data, meta = null) {
    if (!data) return;
    this.pageViewer.clearRoot("detail");

    this._createHeroSection(data);
    if (data.posters?.length) this.ui.createPosters(this.root, data.posters);

    this._createEpisodesSection(data.episodes, data.showId, data.seasonNumber);

    if (data.cast?.length) {
      this.ui.createCastSection(this.root, data.cast);
    }
    if (data.videos?.length) {
      this.ui.createVideoSection(this.root, data.videos);
    }
  }

  _createHeroSection(data) {
    const hero = this.ui.el("div", "detail-hero-section");
    const img = this.ui.el("img", "detail-hero-poster");

    img.alt = data.title || "season_poster";
    img.src = data.poster || "assets/defaults/default-poster-portrait.png";
    hero.appendChild(img);

    const div = this.ui.el("div", ["primary-details", "glass"]);
    this.ui.createTitleBlock(div, data.title);

    this._createSeasonMeta(div, data);
    if (data?.overview)
      this.ui.addSectionOverview(div, "overview", data.overview);

    hero.appendChild(div);
    this.root.appendChild(hero);
  }

  _createSeasonMeta(parent, data = {}) {
    const metaChipsRow = this.ui.createFlexRow(parent);
    metaChipsRow.classList.add("meta-facts-container-row");
    this.ui.addChip(
      metaChipsRow,
      `★ ${data.rating.toFixed(1)}`,
      "rating",
      data.rating,
    );

    this.ui.addMetaFactChip(metaChipsRow, "Aired:", data.airDate);
    this.ui.addMetaFactChip(metaChipsRow, "Season:", data.seasonNumber);
    this.ui.addMetaFactChip(metaChipsRow, "Episodes:", data.episodes.length);
    this.ui.addMetaFactChip(metaChipsRow, "Network:", data.networks[0]?.name);

    parent.appendChild(metaChipsRow);
  }

  _createEpisodesSection(episodes = [], showId, seasonNumber) {
    if (!episodes.length) return;
    const { section, scroller } = this.ui.createScrollSection("Episodes");

    episodes.forEach((ep) => {
      const card = this.ui.scrollCard(["video-card", "glass"]);
      card.dataset.type = "tv";
      card.dataset.seriesId = showId;
      card.dataset.seasonNumber = seasonNumber;
      card.dataset.episodeNumber = ep.episodeNumber;

      const img = this.ui.memberImg(
        ep.still || "./assets/defaults/episode.png",
        ep.name,
        ["credit-card-img"],
      );

      const meta = this.ui.el("div", "video-label");

      const titleEl = this.ui.el("div", "card-title");
      titleEl.textContent = `${ep.episodeNumber}. ${ep.name}`;

      const subEl = this.ui.el("div", "card-title");
      subEl.textContent = [
        ep.runtime,
        ep.rating && `${ep.rating} ★`,
        ep.airDate,
      ]
        .filter(Boolean)
        .join(" • ");

      meta.append(titleEl, subEl);
      card.append(img, meta);
      scroller.appendChild(card);
    });

    section.appendChild(scroller);
    this.root.appendChild(section);
  }
}

export default SeasonPage;

class CompanyPage {
  constructor(pageViewer, root) {
    this.pageViewer = pageViewer;
    this.ui = pageViewer.uiFactory;
    this.root = root;
  }

  _createCompanyMeta(parent, data = {}) {
    const metaChipsRow = this.ui.createFlexRow(parent);
    metaChipsRow.classList.add("meta-facts-container-row");
    if (data.totalMovies)
      this.ui.addMetaFactChip(metaChipsRow, "Movies:", data.totalMovies);
    if (data.totalShows)
      this.ui.addMetaFactChip(metaChipsRow, "Tv Shows:", data.totalShows);
    if (data.parentCompany)
      this.ui.addTextLine(parent, "Parent Company", data.parentCompany);
    if (data.headquarters)
      this.ui.addTextLine(parent, "Headquarters", data.headquarters);
    if (data.originCountry)
      this.ui.addTextLine(parent, "Country", data.originCountry);
  }

  _createHeroSection(data) {
    const hero = this.ui.el("div", "detail-hero-section");

    const img = this.ui.el("img", "detail-hero-company");
    img.alt = data.title || "company_logo";
    img.src = data.poster || "assets/defaults/default-poster-portrait.png";
    hero.appendChild(img);

    const div = this.ui.el("div", ["primary-details", "glass"]);
    this.ui.createTitleBlock(div, data.title);

    this._createCompanyMeta(div, data);

    if (data.overview)
      this.ui.addSectionOverview(div, "overview", data.overview);
    if (data.homepage) this.ui.createMoreLink(div, data.homepage);

    hero.appendChild(div);
    this.root.appendChild(hero);
  }

  _renderMediaScroller(heading, companyId, mediaType, firstPageItems) {
    const { scroller, section } = this.ui.createScrollSection(heading);
    section.appendChild(scroller);
    this.root.appendChild(section);
    const endpoint = `discover/${mediaType}?with_companies=${companyId}&`;

    const pageKey = `${endpoint}::page=1`;
    this.pageViewer.cardStore.setPage(pageKey, firstPageItems);

    new this.pageViewer.ScrollObserver({
      appServices: this.pageViewer.appServices,
      cardFactory: this.pageViewer.cardFactory,
      cardStore: this.pageViewer.cardStore,
      container: scroller,
      endpoint,
      page: 2,
      pageViewer: this.pageViewer,
      recommendations: firstPageItems.map((i) => i.id),
    });
  }
  createFor(data, meta = null) {
    if (!data) return;

    this.pageViewer.clearRoot("detail");

    this._createHeroSection(data);

    if (data.movies)
      this._renderMediaScroller("Movies", data.id, "movie", data.movies);
    if (data.tvShows)
      this._renderMediaScroller("TV Shows", data.id, "tv", data.tvShows);
  }
}

export default CompanyPage;

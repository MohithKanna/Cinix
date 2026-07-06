class CastPage {
  constructor(pageViewer, root) {
    this.pageViewer = pageViewer;
    this.ui = pageViewer.uiFactory;
    this.root = root;
  }

  _calculateAge(birthday, deathday) {
    const birthDate = new Date(birthday);
    const endDate = deathday ? new Date(deathday) : new Date();
    let age = endDate.getFullYear() - birthDate.getFullYear();
    const m = endDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  _createHeroSection(data) {
    const hero = this.ui.el("div", "detail-hero-section");
    const img = this.ui.el("img", "detail-hero-poster");
    img.alt = data.title || "person_photo";
    img.src = data.poster || "assets/defaults/default-cast-fallback.png";
    hero.appendChild(img);

    const div = this.ui.el("div", ["primary-details", "glass"]);

    this.ui.createTitleBlock(div, data.title);

    if (data.alsoKnownAs && data.alsoKnownAs.length > 0) {
      const asloKnown = data.alsoKnownAs
        .map((c) => c || "")
        .filter(Boolean)
        .join(", ");
      this.ui.addTextLine(div, "Also Know as", asloKnown);
    }

    this._createPersonMeta(div, data);
    this.ui.addSectionOverview(div, "overview", data.overview);
    this.ui.createMoreLink(div, data.imdbUrl);
    hero.appendChild(div);
    this.root.appendChild(hero);
  }

  _createPersonMeta(parent, data = {}) {
    if (data.birthday) this.ui.addTextLine(parent, "Born Day", data.birthday);

    if (data.placeOfBirth)
      this.ui.addTextLine(parent, "Born in", data.placeOfBirth);

    this.ui.addTextLine(
      parent,
      "Age",
      this._calculateAge(data.birthday, data.deathday),
    );

    if (data.deathday) this.ui.addTextLine(parent, "Died in", data.deathday);

    const metaChipsRow = this.ui.createFlexRow(parent);
    metaChipsRow.classList.add("meta-facts-container-row");
    this.ui.addMetaFactChip(metaChipsRow, "Gender:", data?.gender);
    this.ui.addMetaFactChip(
      metaChipsRow,
      "Department:",
      data.knownForDepartment,
    );
    this.ui.addMetaFactChip(metaChipsRow, "Popularity", data.popularity);

    parent.appendChild(metaChipsRow);
  }
  _renderCreditsScroller(credits = []) {
    if (!credits.length) return;

    const { scroller, section } = this.ui.createScrollSection("Known for");

    credits.forEach((media) => {
      const card = this.ui.scrollCard(["glass", "video-card"]);
      card.dataset.id = media.id;
      card.dataset.type = media.type;
      const ctn = document.createElement("div");
      ctn.className = "card-media";

      const subLabelText = media.character
        ? `Known As  ${media.character}`
        : "";
      const mainLabelText = media.title ? `In ${media.title}` : "";
      const img = this.ui.memberImg(
        media.backdrop || "assets/defaults/movieLandscape.png",
        media.title,
        ["video-img"],
      );
      ctn.append(img);

      const metaContainer = this.ui.el("div", "video-label");
      const titleEl = this.ui.el("div", "card-title");
      titleEl.textContent = mainLabelText;

      const subLabelEl = this.ui.el("div", "card-title");
      subLabelEl.textContent = subLabelText;

      metaContainer.append(subLabelEl, titleEl);
      card.append(ctn, metaContainer);

      scroller.appendChild(card);
    });

    section.appendChild(scroller);
    this.root.appendChild(section);
  }
  createFor(data, meta = null) {
    if (!data) return;

    this.pageViewer.clearRoot("detail");

    this._createHeroSection(data);
    if (data.posters?.length) {
      this.ui.createPosters(this.root, data.posters);
    }

    if (data?.credits?.length) {
      this._renderCreditsScroller(data.credits);
    }
  }
}

export default CastPage;

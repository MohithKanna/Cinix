class UiFactory {
  constructor(pageViewer) {
    this.pageViewer = pageViewer;
    this.ScrollObserver = pageViewer.ScrollObserver;
  }

  createTitleBlock(parent, titleText, taglineText = "") {
    const div = this.el("div", "title-block");

    const h1 = this.el("h1");
    h1.textContent = titleText;
    div.appendChild(h1);

    if (taglineText && taglineText !== "—") {
      const p = this.el("p", "tagline-text");
      p.textContent = taglineText;
      div.appendChild(p);
    }

    parent.appendChild(div);
    return div;
  }

  createFlexRow(parent) {
    const row = this.el("div", "content-badges-row");
    parent.appendChild(row);
    return row;
  }

  addChip(parent, text, type = "default", ratingValue = null) {
    if (!text || text === "—") return null;
    let classList = ["chip"];

    if (type === "rating") classList.push("chip--rating");
    else if (type === "cutout") classList = ["chip--cutout"];
    else if (type === "meta") classList.push("chip--meta");
    else if (type === "genre") classList.push("chip-genre");
    else if (type === "watchlist") classList.push("chip-watchlist");

    const chip = this.el("span", classList);
    chip.textContent = text;

    if (type === "rating" && ratingValue !== null) {
      const score = Number(ratingValue);
      let level = "low";
      if (score >= 8) level = "high";
      else if (score >= 5.5) level = "mid";

      chip.setAttribute("data-level", level);
    }

    parent.appendChild(chip);
    return chip;
  }

  addMicroStatsLine(parent, textString) {
    if (!textString || textString === "—") return null;

    const div = this.el("div", "movie-micro-stats");
    div.textContent = textString;

    parent.appendChild(div);
    return div;
  }

  addSectionOverview(parent, headerTitle, bodyText) {
    if (!bodyText || bodyText === "—") return null;

    const section = this.el("section", "movie-overview-block");

    const title = this.el("h2", "overview-title");
    title.textContent = headerTitle;

    const text = this.el("p", "overview-text");
    text.textContent = bodyText;

    section.append(title, text);
    parent.appendChild(section);
    return section;
  }

  addFinancialsLine(parent, budgetText, revenueText) {
    const budgetValid =
      budgetText && budgetText !== "—" && !budgetText.includes("NaN");
    const revenueValid =
      revenueText && revenueText !== "—" && !revenueText.includes("NaN");
    if (!budgetValid && !revenueValid) return null;

    const div = this.el("div", "movie-financials-line");

    const budgetStr = budgetValid ? `Budget: ${budgetText}` : "";
    const revenueStr = revenueValid ? `Revenue: ${revenueText}` : "";

    div.textContent = [budgetStr, revenueStr].filter(Boolean).join("  •  ");

    parent.appendChild(div);
    return div;
  }

  addTextLine(parent, label, textContent) {
    if (!textContent || textContent === "—" || textContent === "") return null;

    const container = this.el("div", "movie-countries-block");

    const labelEl = this.el("span", "countries-label");
    labelEl.textContent = `${label}: `;

    const valueEl = this.el("span", "countries-value");
    valueEl.textContent = textContent;

    container.append(labelEl, valueEl);
    parent.appendChild(container);

    return container;
  }

  addMetaFactChip(parent, label, value) {
    if (!value || value === "—") return null;

    const chip = this.el("span", ["chip", "chip--meta-fact"]);

    const labelSpan = this.el("span", "meta-fact-label");
    labelSpan.textContent = `${label} `;

    const valueSpan = this.el("span", "meta-fact-value");
    valueSpan.textContent = value;

    chip.append(labelSpan, valueSpan);
    parent.appendChild(chip);
    return chip;
  }

  cardLabel(text, cls = ["card-details"]) {
    const div = this.el("div", [...cls].filter(Boolean));
    div.textContent = text;
    return div;
  }

  createBackdrops(root, backdrops = []) {
    if (!backdrops.length) return;
    const section = this.el("div", "carousel-section");
    const wrapper = this.el("div", "carousel-wrapper");
    const track = this.el("div", "carousel-track");

    let current = 0;
    let autoTimer = null;

    const goTo = (index) => {
      current = (index + backdrops.length) % backdrops.length;
      track.style.transform = `translateX(-${current * 100}%)`;
    };

    const startAuto = () => {
      autoTimer = setInterval(() => goTo(current + 1), 4000);
    };

    const resetAuto = () => {
      clearInterval(autoTimer);
      startAuto();
    };

    backdrops.forEach((backdrop) => {
      if (!backdrop) return;

      const slide = this.el("div", "carousel-slide");
      const img = this.memberImg(backdrop, "backdrop", ["backdrop-img"]);
      slide.append(img);
      slide.onclick = () => this.showOverlay("backdrop", backdrop);
      track.appendChild(slide);
    });

    const btnPrev = this.el("button", ["carousel-btn", "carousel-btn--prev"]);
    btnPrev.innerHTML = "‹";
    btnPrev.onclick = (e) => {
      e.stopPropagation();
      resetAuto();
      goTo(current - 1);
    };

    const btnNext = this.el("button", ["carousel-btn", "carousel-btn--next"]);
    btnNext.innerHTML = "›";
    btnNext.onclick = (e) => {
      e.stopPropagation();
      resetAuto();
      goTo(current + 1);
    };

    wrapper.append(track, btnPrev, btnNext);
    section.appendChild(wrapper);
    root.appendChild(section);
    startAuto();
  }

  createCastSection(root, credits = []) {
    if (!credits.length) return;

    const { scroller, section } = this.createScrollSection("Cast & Crew");

    credits.forEach(({ id, name, url } = {}) => {
      if (!id || !name) return;
      const card = this.scrollCard(["cast-card"]);
      card.dataset.id = id;
      card.dataset.type = "person";
      const img = this.memberImg(url || "./assets/defaults/profile.png", name, [
        "cast-img",
      ]);
      const label = this.cardLabel(name, ["cast-label"]);

      card.append(img, label);
      scroller.appendChild(card);
    });

    section.appendChild(scroller);
    root.appendChild(section);
  }

  createCompanySection(root, companies = []) {
    if (!companies.length) return;

    const { scroller, section } = this.createScrollSection("Companies");

    companies.forEach((company) => {
      if (!company?.name) return;

      const card = this.scrollCard(["company-card", "glass"]);
      card.dataset.type = "company";
      card.dataset.id = company.id;
      const img = this.memberImg(
        company.url || "./assets/defaults/company.png",
        company.name,
        ["company-img"],
      );
      const label = this.cardLabel(company.name, ["company-label"]);

      card.append(img, label);
      scroller.appendChild(card);
    });

    section.appendChild(scroller);
    root.appendChild(section);
  }

  createMoreLink(parent, url) {
    const p = this.el("p", "more-link-container");
    const a = this.el("a", "more-link");
    if (!url || url === "") return;

    a.href = url || "#";
    a.textContent = "click here";
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    p.append(document.createTextNode("To know more: "), a);
    parent.appendChild(p);
  }

  createPosters(root, poster = []) {
    if (!poster?.length) return;

    const { scroller, section } = this.createScrollSection("Images");

    poster.forEach((poster) => {
      const card = this.scrollCard(["poster-card", "glass"]);
      const img = this.memberImg(
        poster || "./assets/defaults/poster.png",
        "profile",
        ["card-img"],
      );
      card.append(img);
      img.onclick = () => this.showOverlay("poster", poster);
      scroller.append(card);
    });
    section.appendChild(scroller);
    root.appendChild(section);
  }

  createRecommendation(root, data, meta = null) {
    const { scroller, section } = this.createScrollSection(
      "More Similar You Can Like",
    );

    section.appendChild(scroller);
    root.appendChild(section);

    const recommendationsMeta = meta?.scrollers?.recommendations ?? null;

    const observer = new this.ScrollObserver({
      appServices: this.pageViewer.appServices,
      cardFactory: this.pageViewer.cardFactory,
      cardStore: this.pageViewer.cardStore,
      // recommendations: data.recommendations,
      container: scroller,
      endpoint: `/${data.type}/${data.id}/recommendations`,
      meta: recommendationsMeta,
      pageViewer: this.pageViewer,
    });
    return observer;
  }

  createScrollSection(heading = "") {
    const section = this.el("div", ["card-container", "glass-heavy"]);
    const h = this.el("h2", ["card-container-title"]);
    h.textContent = heading;

    const scroller = this.el("div", "card-scroller");
    section.appendChild(h);
    section.appendChild(scroller);

    return { scroller, section };
  }

  createVideoSection(root, videos = []) {
    if (!videos.length) return;
    const { scroller, section } = this.createScrollSection("Videos and More");

    videos.forEach((vid) => {
      const key = vid.key || vid.id || null;
      const site = (vid.site || "").toLowerCase();
      const title = vid.name || vid.title || vid.video || "Video";
      const url = vid.url || vid.link || "assets/defaults/youtube.png" || "";

      let thumb = "assets/defaults/youtube.png",
        embed = null;

      if (site === "youtube" && key) {
        thumb = `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
        embed = `https://www.youtube.com/embed/${key}`;
      } else if (url?.includes("youtube.com/watch")) {
        const m = url.match(/[?&]v=([^&]+)/);
        if (m?.[1]) {
          thumb = `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
          embed = `https://www.youtube.com/embed/${m[1]}`;
        }
      } else if (vid.thumbnail) {
        thumb = vid.thumbnail;
        embed = url;
      } else {
        embed = url;
      }

      const card = this.scrollCard(["video-card", "glass"]);
      const img = this.memberImg(thumb, title, ["video-img"]);
      const label = this.cardLabel(title, ["video-label"]);

      card.append(img, label);
      card.onclick = () => {
        const src = embed || url || vid.source || null;
        if (src) this.showOverlay("video", src);
      };
      scroller.appendChild(card);
    });

    section.appendChild(scroller);
    root.appendChild(section);
  }

  el(tag, cls = null) {
    const el = document.createElement(tag);
    if (cls) {
      Array.isArray(cls) ? el.classList.add(...cls) : el.classList.add(cls);
    }
    return el;
  }

  ensureOverlay(type) {
    const key = `_overlay_${type}`;
    if (this[key]) return this[key];
    const overlay = this.el("div", ["overlay", `overlay-${type}`]);
    const container = this.el("div", ["overlay-container", "glass-heavy"]);
    const isVideo = type === "video";
    let media;

    if (type === "video") media = this.el("iframe", "overlay-media");
    else if (type === "backdrop") media = this.el("img", "overlay-media");
    else media = this.el("img", "overlay-poster");

    if (isVideo) {
      media.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      media.allowFullscreen = true;
    } else {
      media.alt = "Backdrop Overlay";
    }

    const close = this.el("button", "overlay-close");
    close.textContent = "x";
    close.onclick = (e) => {
      e.stopPropagation();
      this.hideOverlay(overlay, media, isVideo);
    };

    container.append(media, close);
    overlay.appendChild(container);
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.hideOverlay(overlay, media, isVideo);
      }
    };

    document.body.appendChild(overlay);
    this[key] = { media, overlay };
    return this[key];
  }

  hideOverlay(overlay, media, isVideo) {
    overlay.classList.remove("active");
    media.src = "";
    document.body.classList.remove("no-scroll");
  }

  memberImg(src, alt, cls = ["card-img"]) {
    const img = this.el("img", [...cls].filter(Boolean));
    img.alt = alt;
    img.src = src || "";
    img.loading = "lazy";
    img.onerror = function () {
      this.src = "";
    };
    return img;
  }

  scrollCard(cls = ["cards"]) {
    return this.el("div", [...cls].filter(Boolean));
  }

  showOverlay(type, src) {
    const { media, overlay } = this.ensureOverlay(type);
    media.src = type === "video" ? this.toEmbedUrl(src) : src;
    overlay.classList.add("active");
    document.body.classList.add("no-scroll");
  }

  toEmbedUrl(src) {
    if (typeof src !== "string") return src;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = src.match(regExp);

    if (match && match[2].length === 11) {
      const videoId = match[2];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }

    if (src.includes("youtube.com/embed") && !src.includes("autoplay")) {
      return src + (src.includes("?") ? "&" : "?") + "autoplay=1";
    }

    return src;
  }
}
export default UiFactory;

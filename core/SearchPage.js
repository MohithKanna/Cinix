class SearchPage {
  constructor(pageViewer, root) {
    this.pageViewer = pageViewer;
    this.ui = pageViewer.uiFactory;
    this.root = root;
    this._observer = null;
    this._scroller = null;
    this._suggestionTimer = null;
    this._searchWrapper = null;

    this._onDocumentClick = this._handleDocumentClick.bind(this);

    this.state = {
      query: "",
      tab: "all",
      genre: [],
      sort: "popularity.desc",
      language: null,
      year: null,
      adult: false,
    };
  }

  createFor(params = {}, meta = null) {
    this.disconnect();
    this.pageViewer.clearRoot("search");

    const restoredState = meta?.state;
    this.state = {
      query: params.q ?? restoredState?.query ?? "",
      tab: params.tab ?? restoredState?.tab ?? "all",
      genre: params.genre
        ? params.genre.split(",")
        : (restoredState?.genre ?? []),
      sort: params.sort ?? restoredState?.sort ?? "popularity.desc",
      language: params.language ?? restoredState?.language ?? null,
      year: params.year ?? restoredState?.year ?? null,
      adult:
        params.adult === "1"
          ? true
          : params.adult === "0"
            ? false
            : (restoredState?.adult ?? false),
    };

    this._buildSearchBar();
    this._buildTabBar();
    this._buildFilterPanel();
    this._buildResultsGrid();

    document.addEventListener("click", this._onDocumentClick);

    this._reloadResults(meta?.observerMeta);
  }

  _buildSearchBar() {
    this._searchWrapper = this.ui.el("div", "search-bar-wrapper");
    const input = this.ui.el("input", "search-input");
    input.name = "query";
    input.type = "text";
    input.autocomplete = "off";

    input.placeholder = "Search movies, shows, people...";
    input.value = this.state.query?.replace(/\+/g, " ");
    this._searchInput = input;

    const btn = this.ui.el("button", "search-btn");
    btn.textContent = "Search";

    const suggestions = this.ui.el("div", [
      "search-suggestions",
      "glass-heavy",
    ]);
    suggestions.style.display = "none";
    this._suggestions = suggestions;

    input.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      clearTimeout(this._suggestionTimer);
      if (val.length < 3) {
        this._hideSuggestions();
        return;
      }
      this._suggestionTimer = setTimeout(() => {
        this._fetchSuggestions(val);
      }, 300);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this._hideSuggestions();
        this._applyState({ query: input.value.trim() });
      }
      if (e.key === "Escape") this._hideSuggestions();
    });

    btn.addEventListener("click", () => {
      this._hideSuggestions();
      this._applyState({ query: input.value.trim() });
    });

    this._searchWrapper.append(input, btn, suggestions);
    this.root.appendChild(this._searchWrapper);
  }

  _handleDocumentClick(e) {
    if (this._searchWrapper && !this._searchWrapper.contains(e.target)) {
      this._hideSuggestions();
    }
  }

  async _fetchSuggestions(query) {
    try {
      const results = await this.pageViewer.appServices.getSuggestion(
        "search/multi",
        { query, page: 1 },
      );
      this._showSuggestions(results ?? []);
    } catch (err) {
      console.error("Suggestions fetch failure:", err);
    }
  }

  _showSuggestions(results) {
    this._suggestions.innerHTML = "";
    if (!results.length) {
      this._hideSuggestions();
      return;
    }

    const frag = document.createDocumentFragment();

    results.forEach((item) => {
      const row = this.ui.el("div", "suggestion-item");
      const img = this.ui.el("img", "suggestion-img");

      if (item?.image) {
        img.src = item.image;
      } else {
        img.src =
          item?.type === "person"
            ? "assets/defaults/suggestionProfile.png"
            : "assets/defaults/movie.png";
      }

      img.alt = item?.title || "Suggestion Link";

      const info = this.ui.el("div", "suggestion-info");
      const title = this.ui.el("span", "suggestion-title");
      title.textContent = item?.title;
      const type = this.ui.el("span", "suggestion-type");
      type.textContent = item?.type;

      info.append(title, type);
      row.append(img, info);

      row.addEventListener("click", () => {
        this._hideSuggestions();
        this._searchInput.value = item.title;
        this._applyState({ query: item.title });
      });

      frag.appendChild(row);
    });

    this._suggestions.appendChild(frag);
    this._suggestions.style.display = "block";
  }

  _hideSuggestions() {
    if (!this._suggestions) return;
    this._suggestions.style.display = "none";
    this._suggestions.innerHTML = "";
  }

  _buildTabBar() {
    const tabs = [
      { key: "all", label: "All" },
      { key: "movie", label: "Movies" },
      { key: "tv", label: "TV" },
      { key: "person", label: "People" },
    ];

    const bar = this.ui.el("div", ["search-tab-bar", "glass"]);
    this._tabBtns = new Map();

    tabs.forEach(({ key, label }) => {
      const btn = this.ui.el("button", "search-tab-btn");
      btn.textContent = label;
      btn.dataset.tab = key;
      if (key === this.state.tab) btn.classList.add("active");

      btn.addEventListener("click", () => {
        this._applyState({ tab: key, genre: [] });
      });

      this._tabBtns.set(key, btn);
      bar.appendChild(btn);
    });

    this.root.appendChild(bar);
  }

  _syncTabBar() {
    this._tabBtns.forEach((btn, key) => {
      btn.classList.toggle("active", key === this.state.tab);
    });
  }

  _buildFilterPanel() {
    const panel = this.ui.el("div", ["search-filter-panel", "glass-heavy"]);

    const genreSection = this.ui.el("div", "filter-section");
    const genreLabel = this.ui.el("p", "filter-label");
    genreLabel.textContent = "Genres";
    this._genreContainer = this.ui.el("div", "filter-genre-list");
    this._renderGenreSelector();
    genreSection.append(genreLabel, this._genreContainer);

    const sortSection = this.ui.el("div", "filter-section");
    const sortLabel = this.ui.el("p", "filter-label");
    sortLabel.textContent = "Sort By";
    const sortSelect = this.ui.el("select", "filter-select");
    sortSelect.id = "search-sort";
    sortSelect.name = "sort";

    [
      { value: "popularity.desc", label: "Most Popular" },
      { value: "vote_average.desc", label: "Top Rated" },
      { value: "release_date.desc", label: "Newest First" },
      { value: "title.asc", label: "A to Z" },
    ].forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      if (value === this.state.sort) opt.selected = true;
      sortSelect.appendChild(opt);
    });
    sortSelect.addEventListener("change", (e) => {
      this._applyState({ sort: e.target.value });
    });
    sortSection.append(sortLabel, sortSelect);

    const langSection = this.ui.el("div", "filter-section");
    const langLabel = this.ui.el("p", "filter-label");
    langLabel.textContent = "Language";
    const langSelect = this.ui.el("select", "filter-select");

    const blankOpt = document.createElement("option");
    blankOpt.value = "";
    blankOpt.textContent = "Any";
    langSelect.appendChild(blankOpt);

    Object.entries(this.pageViewer.dataHandler.factory.langDep)
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([iso, name]) => {
        const opt = document.createElement("option");
        opt.value = iso;
        opt.textContent = name;
        if (iso === this.state.language) opt.selected = true;
        langSelect.appendChild(opt);
      });
    const adultSection = this.ui.el("div", "filter-section-horizontal");
    const adultLabel = this.ui.el("label", "filter-checkbox-label");
    const adultCheckbox = this.ui.el("input", "filter-checkbox");

    adultCheckbox.type = "checkbox";
    adultCheckbox.id = "search-adult";
    adultCheckbox.name = "adult";
    adultCheckbox.checked = this.state.adult;

    adultCheckbox.addEventListener("change", (e) => {
      this._applyState({ adult: e.target.checked });
    });

    const adultText = this.ui.el("span", "filter-checkbox-text");
    adultLabel.htmlFor = "search-adult";

    adultText.textContent = "Filtered Search";
    adultLabel.append(adultCheckbox, adultText);
    adultSection.append(adultLabel);

    langSelect.addEventListener("change", (e) => {
      this._applyState({ language: e.target.value || null });
    });
    langSection.append(langLabel, langSelect);

    panel.append(genreSection, sortSection, langSection, adultSection);
    this.root.appendChild(panel);
    this._filterPanel = panel;
  }

  _renderGenreSelector() {
    this._genreContainer.innerHTML = "";
    const genres = this.pageViewer.dataHandler.factory.getGenresForTab(
      this.state.tab,
    );

    if (!genres?.length) {
      this._genreContainer.style.display = "none";
      return;
    }
    this._genreContainer.style.display = "flex";

    const frag = document.createDocumentFragment();
    genres.forEach(({ id, name }) => {
      const btn = this.ui.el("button", "filter-genre-btn");
      btn.textContent = name;
      btn.dataset.id = id;
      if (this.state.genre.includes(String(id))) btn.classList.add("active");

      btn.addEventListener("click", () => {
        const sid = String(id);
        const updatedGenres = this.state.genre.includes(sid)
          ? this.state.genre.filter((g) => g !== sid)
          : [...this.state.genre, sid];
        this._applyState({ genre: updatedGenres });
      });

      frag.appendChild(btn);
    });
    this._genreContainer.appendChild(frag);
  }

  _syncGenreButtons() {
    this._genreContainer
      .querySelectorAll(".filter-genre-btn")
      .forEach((btn) => {
        btn.classList.toggle(
          "active",
          this.state.genre.includes(btn.dataset.id),
        );
      });
  }

  _buildResultsGrid() {
    const wrapper = this.ui.el("div", [
      "search-results-wrapper",
      "glass-heavy",
    ]);
    const scroller = this.ui.el("div", "search-results-grid");
    this._scroller = scroller;
    wrapper.appendChild(scroller);
    this.root.appendChild(wrapper);
  }

  _buildEndpoint() {
    const { query, tab } = this.state;
    const hasQuery = query.length >= 3;

    if (tab === "person") {
      return hasQuery ? "search/person" : "person/popular";
    }
    if (tab === "all") {
      return hasQuery ? "search/multi" : "discover/movie";
    }
    return hasQuery ? `search/${tab}` : `discover/${tab}`;
  }

  _buildParams() {
    const { query, genre, sort, language, tab, year, adult } = this.state;
    const hasQuery = query.length >= 3;
    const params = {};

    if (hasQuery) {
      params.query = query;
    } else {
      params.sort_by = sort;
      if (genre.length) params.with_genres = genre.join(",");
      if (language) params.with_original_language = language;
      if (year) {
        if (tab === "tv") params.first_air_date_year = year;
        else params.primary_release_year = year;
      }
    }
    params.include_adult = adult;
    return params;
  }

  _applyState(newState) {
    this.state = { ...this.state, ...newState };

    this._syncTabBar();

    if ("tab" in newState) this._renderGenreSelector();
    else if ("genre" in newState) this._syncGenreButtons();

    this._syncURL();
    this._reloadResults();
  }

  _syncURL() {
    const { query, tab, genre, sort, language, adult } = this.state;
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (tab !== "all") p.set("tab", tab);
    if (genre.length) p.set("genre", genre.join(","));
    if (sort !== "popularity.desc") p.set("sort", sort);
    if (language) p.set("language", language);
    if (adult) p.set("adult", "1");

    const hash = p.toString() ? `#search?${p.toString()}` : "#search";
    history.replaceState(null, "", hash);
  }

  _reloadResults(observerMeta = null) {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }

    this._scroller.innerHTML = "";
    this._observer = new this.pageViewer.ScrollObserver({
      container: this._scroller,
      endpoint: this._buildEndpoint(),
      params: this._buildParams(),
      appServices: this.pageViewer.appServices,
      cardFactory: this.pageViewer.cardFactory,
      cardStore: this.pageViewer.cardStore,
      pageViewer: this.pageViewer,
      direction: "vertical",
      meta: observerMeta,
    });
  }

  getMeta() {
    return {
      state: { ...this.state },
      observerMeta: this._observer ? this._observer.getMeta() : null,
    };
  }

  disconnect() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    document.removeEventListener("click", this._onDocumentClick);
    clearTimeout(this._suggestionTimer);
    this._hideSuggestions();
  }
}

export default SearchPage;

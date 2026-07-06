class DataFactory {
  constructor() {
    this.langDep = {};
    this.genreDep = {};
    this.genreMap = new Map([
      ["movie", []],
      ["tv", []],
      ["all", []],
      ["person", []],
    ]);
    this._posterWidths = [92, 154, 185, 342, 500, 780];
  }

  setupGenres = (movieList = [], tvList = []) => {
    this.genreMap.set(
      "movie",
      movieList.map(({ id, name }) => ({ id, name })),
    );

    this.genreMap.set(
      "tv",
      tvList.map(({ id, name }) => ({ id, name })),
    );

    const seen = new Set();
    const merged = [...movieList, ...tvList].filter(({ id }) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    this.genreMap.set(
      "all",
      merged.map(({ id, name }) => ({ id, name })),
    );

    merged.forEach(({ id, name }) => {
      this.genreDep[String(id)] = name;
    });
  };

  getGenresForTab(tab) {
    return this.genreMap.get(tab) ?? [];
  }

  backdropsPath(arr, size = 500) {
    if (this.checkBadInput(arr, "object", "BACKDROP")) return [];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].iso_639_1 || arr[i].iso_3166_1) continue;
      result.push(`https://image.tmdb.org/t/p/w${size}` + arr[i].file_path);
    }
    return result;
  }

  calSeasonsAndEps(seasons, episode) {
    if (!seasons && !episode) return null;
    else if (!seasons && episode) return `${episode} Episodes`;
    else if (seasons && !episode) return `${seasons} Seasons`;
    else return `${seasons} Seasons ${episode} Episode`;
  }

  checkBadInput(input, type, warn) {
    if (typeof input !== type) {
      console.warn(`BAD INPUT FOR ${warn}`);
      return true;
    }
    return false;
  }

  toFixedNumber(value, digits = 1) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue)
      ? Number(numericValue.toFixed(digits))
      : null;
  }

  createCompanyArr(arr) {
    if (this.checkBadInput(arr, "object", "COMPANY")) return [];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      result.push({
        id: arr[i].id,
        name: arr[i].name,
        url: this.getImgPath(arr[i].logo_path),
      });
    }
    return result;
  }

  createCountryArr(arr) {
    if (this.checkBadInput(arr, "object", "COUNTRY")) return [];
    const result = [];

    for (let i = 0; i < arr.length; i++)
      if (arr[i].name) result.push(arr[i].name);

    return result;
  }
  createCreditsArr(arr) {
    if (this.checkBadInput(arr, "object", "CREDITS")) return [];
    const result = [];

    const set = new Set();
    for (let i = 0; i < arr.length; i++) {
      let { id, name, popularity, profile_path } = arr[i];
      if (!id) continue;
      if (set.has(id)) continue;
      result.push({
        id,
        name: name ?? null,
        popularity,
        url: this.getImgPath(profile_path),
      });
      set.add(id);
    }
    result.sort((a, b) => b.popularity - a.popularity);
    return result.length >= 50 ? result.slice(0, 50) : result;
  }
  createEpisodeCards(arr) {
    if (this.checkBadInput(arr, "object", "EPISODES")) return [];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const data = arr[i];

      if (!data.id) continue;
      result.push({
        airDate: this.formatDate(data.air_date),
        episodeNumber: data.episode_number,
        episodeType: data.episode_type ?? null,
        id: data.id,
        name: data.name ?? null,
        overview: data.overview ?? null,
        rating: this.toFixedNumber(data.vote_average),
        runtime: this.formatRuntime(data.runtime),
        seasonNumber: data.season_number,
        showId: data.show_id,
        still: this.getImgPath(data.still_path, 342),
      });
    }
    return result;
  }
  createGenreArr(arr, type) {
    if (this.checkBadInput(arr, "object", "GENRE")) return [];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const obj = arr[i];
      if (!obj.id || !obj.name) continue;
      result.push({
        id: obj.id,
        name: obj.name,
        type,
      });
    }
    return result;
  }
  createLangArr(arr) {
    if (this.checkBadInput(arr, "object", "Language")) return [];
    const result = [];

    for (let i = 0; i < arr.length; i++) {
      const lang = this.langDep[arr[i].iso_639_1];
      if (lang) result.push(lang);
    }

    return result;
  }

  createRecommedationArr(arr) {
    if (this.checkBadInput(arr, "object", "RECOMMENDATION")) return [];
    const result = [];

    for (let i = 0; i < arr.length; i++) {
      result.push(arr[i].id);
    }
    return result;
  }
  createSeasonCards(arr) {
    if (this.checkBadInput(arr, "object", "SEASON")) return [];
    const result = [];

    for (let i = 0; i < arr.length; i++) {
      const { id, name, poster_path, season_number } = arr[i];

      if (id)
        result.push({
          name,
          seasonNumber: season_number,
          url: this.getImgPath(poster_path),
        });
    }
    return result;
  }
  createSeasonCast(episodes = []) {
    if (this.checkBadInput(episodes, "object", "SEASON_CAST")) return [];
    const seen = new Set();
    const all = [];

    for (let i = 0; i < episodes.length; i++) {
      const guests = episodes[i].guest_stars ?? [];
      for (let j = 0; j < guests.length; j++) {
        const { id, name, popularity, profile_path } = guests[j];
        if (!id || seen.has(id)) continue;
        seen.add(id);
        all.push({
          id,
          name: name ?? null,
          popularity,
          url: this.getImgPath(profile_path),
        });
      }
    }

    all.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    return all.length > 30 ? all.slice(0, 30) : all;
  }
  dataForCard = (object) => {
    if (!object?.id) return null;
    if (object?.known_for_department) return this.cardForCast(object);

    let title = object?.title ?? object?.name ?? null;
    if (!title) return;

    let type = object?.title ? "movie" : "tv";
    let releaseDate = object?.release_date ?? object?.first_air_date;

    return {
      id: object.id,
      title,
      type,
      vote_average: this.toFixedNumber(object?.vote_average),
      posterPath: this.getResponsiveImgPath(object?.poster_path),
      posterSrcSet: this.getImgSrcSet(object?.poster_path),
      posterSizes: "(max-width: 480px) 140px, (max-width: 768px) 180px, 200px",
      rating: this.toFixedNumber(object?.vote_average),
      genres: this.getGenre(object?.genre_ids, type),
    };
  };
  cardForCast(object) {
    return {
      id: object.id,
      title: object.name ?? null,
      type: "person",
      url: this.getImgPath(object.profile_path, 342),
      rating: null,
      genres: [],
      releaseDate: null,
      popularity: object.popularity ?? null,
      adult: object.adult ?? false,
      softcore: false,
    };
  }
  filterKnowFor(arr) {
    if (this.checkBadInput(arr, "object", "CREDITS")) return [];
    const result = [];

    const set = new Set();
    for (let i = 0; i < arr.length; i++) {
      let {
        backdrop_path,
        character,
        id,
        media_type,
        name,
        popularity,
        title,
      } = arr[i];
      if (!id) continue;
      if (!character) continue;
      if (!title && !name) continue;
      if (set.has(id)) continue;

      result.push({
        backdrop: this.getImgPath(backdrop_path, 342),
        character,
        id,
        popularity,
        title: name ?? title,
        type: media_type,
      });
      set.add(id);
    }
    return result.length >= 30 ? result.slice(0, 30) : result;
  }
  formatCurrency(amount) {
    if (amount === 0 || amount == null) return null;
    return new Intl.NumberFormat("en-US", {
      currency: "USD",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: "currency",
    }).format(amount);
  }
  formatDate = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr + "T00:00:00Z");
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
      year: "numeric",
    }).format(date);

    return formattedDate;
  };
  formatRuntime(minutes) {
    const value = Number(minutes);
    if (!Number.isFinite(value) || value <= 0) return null;

    const hours = Math.floor(value / 60);
    const mins = value % 60;
    return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  }
  getGenre = (genre = [], type) => {
    if (!type) return [];
    return genre.map((id) => {
      if (!id) return null;
      return {
        id,
        type,
        name: this.genreDep[String(id)] ?? "",
      };
    });
  };

  getImgPath(img, size = 500) {
    if (img) {
      return `https://image.tmdb.org/t/p/w${size}` + img;
    }
    return null;
  }

  getImgSrcSet(img) {
    if (!img) return null;
    return this._posterWidths
      .map((size) => `${this.getImgPath(img, size)} ${size}w`)
      .join(", ");
  }

  getResponsiveImgPath(img) {
    if (!img) return null;

    const widths = this._posterWidths;
    const dpr =
      typeof window !== "undefined" && window.devicePixelRatio
        ? window.devicePixelRatio
        : 1;
    const targetWidth = Math.min(500, Math.round(200 * dpr));
    const selectedWidth =
      widths.find((size) => size >= targetWidth) ?? widths[widths.length - 1];

    return this.getImgPath(img, selectedWidth);
  }

  getLang = (lang) => this.langDep[lang] ?? null;

  setup = (setup) => {
    if (setup?.languages) {
      Object.values(setup?.languages).forEach((lang) => {
        if (lang?.iso_639_1 && lang?.english_name)
          this.langDep[lang.iso_639_1] = lang.english_name;
      });
    }
    this.setupGenres(setup?.movieGenres, setup?.tvGenres);
  };
}
const dataFactory = new DataFactory();

export default dataFactory;

import dataHandler from "./DataHandler.js";
import ApiService from "./ApiService.js";

class AppService {
  constructor(config = {}) {
    this.cardStore = config.cardStore;
    this.apiService = new ApiService();
    this.dataHandler = dataHandler;
  }

  detailsForEpisode = async (endpoint, params = {}) => {
    const details = await this.apiService.seasonDetail(endpoint, params);
    return this.dataHandler.handlePage("episode", details);
  };

  detailsForSeason = async (endpoint, params = {}) => {
    const details = await this.apiService.seasonDetail(endpoint, params);
    return this.dataHandler.handlePage("season", details);
  };

  detailsOf = async (id, category) => {
    if (!id) throw new Error("No id provided for fetching details.");
    if (!["movie", "tv", "person", "company"].includes(category)) {
      throw new Error(`Unsupported details category: ${category}`);
    }

    try {
      const details = await this.apiService.allDetails(id, category);
      const page = this.dataHandler.handlePage(category, details);
      if (!page) {
        throw new Error(`Unable to build details for ${category} ${id}`);
      }
      return page;
    } catch (error) {
      throw error;
    }
  };
  getBackdrops = async (category, type, params = {}) => {
    try {
      const list = await this.apiService.list(category, type, params);
      if (list && list.results && list.results.length > 0) {
        const backdrops = [];
        for (let i = 0; i < list.results.length; i++) {
          const data = list.results[i];
          const result = this.dataHandler.handleBackdrop(data);
          result ? backdrops.push(result) : "";
        }
        return backdrops;
      }
    } catch (error) {
      throw error;
    }
    return [];
  };

  listOf = async (category, type, params = {}) => {
    try {
      let list;
      if (category === "movie") {
        if (
          type === "popular" ||
          type === "top_rated" ||
          type === "upcoming" ||
          type === "now_playing"
        ) {
          list = await this.apiService.list(category, type, params);
        }
      } else if (category === "tv") {
        if (
          type === "on_the_air" ||
          type === "airing_today" ||
          type === "popular" ||
          type === "top_rated"
        ) {
          list = await this.apiService.list(category, type, params);
        }
      }
      if (list && list.results) {
        const cardArr = [];
        for (let i = 0; i < list.results.length; i++) {
          const data = list.results[i];
          const card = this.dataHandler.dataForCard(data);
          if (card) {
            cardArr.push(card);
            this.cardStore.set(card);
          }
        }
        return cardArr;
      }
    } catch (error) {
      console.warn(
        `Failed to fetch list for ${category}/${type} (Offline fallback):`,
        error,
      );
    }
    return [];
  };
  getSuggestion = async (endpoint, params = {}) => {
    try {
      const data = await this.apiService.getByUrl(endpoint, params);
      return this.dataHandler.dataForSuggestion(data);
    } catch (error) {
      console.warn("Suggestion fetch failed:", error);
      return [];
    }
  };
  listOfEndPoint = async (endpoint, params = {}) => {
    try {
      const list = await this.apiService.getByUrl(endpoint, params);
      return this._storeCards(list?.results, this.dataHandler.dataForCard);
    } catch (error) {
      throw error;
    }
  };
  _storeCards(data = [], handler) {
    if (data && data.length) {
      const arr = [];
      for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        const card = handler(obj);
        if (card) {
          arr.push(card);
          this.cardStore.set(card);
        }
      }
      return arr;
    }
    return [];
  }
  async setup() {
    try {
      const [languages, movieGenres, tvGenres, countries] = await Promise.all([
        this.apiService.get("/configuration/languages"),
        this.apiService.get("/genre/movie/list"),
        this.apiService.get("/genre/tv/list"),
        this.apiService.get("/configuration/countries"),
      ]);

      this.dataHandler.setup({
        countries,
        tvGenres: [...(tvGenres?.genres || [])],
        movieGenres: [...(movieGenres?.genres || [])],
        languages,
      });
    } catch (error) {
      console.error(
        "AppService setup failed due to network error. Initializing fallback states.",
        error,
      );

      this.dataHandler.setup({
        countries: [],
        tvGenres: [],
        movieGenres: [],
        languages: [],
      });
    }
  }
}
export default AppService;

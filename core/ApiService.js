class ApiService {
  #apiKey;
  constructor() {
    this.baseUrl = "https://api.themoviedb.org/3/";
    this.#apiKey = "41e9d5850597ba9e3757615fc714dbe2";
  }

  __manageKey(endpoints = [], results = []) {
    return endpoints.reduce((acc, endpoint, index) => {
      acc[endpoint] = results[index];
      return acc;
    }, {});
  }

  _buildUrl(endpoint, params = {}) {
    const path = String(endpoint || "").replace(/^\/+/, "");
    const url = new URL(path, this.baseUrl);
    url.searchParams.set("api_key", this.#apiKey);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    return url;
  }

  async _fetch(endpoints, params = {}) {
    const { timeoutMs = 6000, ...queryParams } = params;
    const url = this._buildUrl(endpoints, queryParams);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status} for ${url}`);
      }
      return response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms for ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async allDetails(id, resource = "") {
    if (resource === "movie" || resource === "tv") {
      const subResources = ["credits", "videos", "images", "recommendations"];

      const endpoints = ["details", ...subResources];
      const requests = endpoints.map((endpoint) => {
        const path =
          endpoint === "details"
            ? `${resource}/${id}`
            : `${resource}/${id}/${endpoint}`;
        return this.get(path);
      });

      const results = await Promise.all(requests);
      return this.__manageKey(endpoints, results);
    } else if (resource === "person") {
      const subResources = [
        "details",
        "movie_credits",
        "tv_credits",
        "combined_credits",
        "images",
      ];
      const endpoints = [...subResources];
      const requests = endpoints.map((endpoint) => {
        const path =
          endpoint === "details"
            ? `${resource}/${id}`
            : `${resource}/${id}/${endpoint}`;
        return this.get(path);
      });
      const results = await Promise.all(requests);
      return this.__manageKey(endpoints, results);
    } else if (resource === "company") {
      const endpointMap = {
        alternative_names: `company/${id}/alternative_names`,
        details: `company/${id}`,
        movies: `discover/movie?with_companies=${id}`,
        tv_shows: `discover/tv?with_companies=${id}`,
      };
      const keys = Object.keys(endpointMap);
      const requests = keys.map((key) => this.get(endpointMap[key]));
      const responses = await Promise.all(requests);
      return this.__manageKey(keys, responses);
    }
  }

  details(category, id, params = {}) {
    return this.get(`${category}/${id}`, params);
  }

  discover(resource, params = {}) {
    return this.get(`/discover/${resource}`, params);
  }
  get(endpoint, params = {}) {
    return this._fetch(endpoint, params);
  }
  getByUrl(endpoint, params = {}) {
    return this.get(endpoint, params);
  }

  list(resource, type, params = {}) {
    return this.get(`${resource}/${type}`, params);
  }
  search(category, query, params = {}) {
    return this.get(`/search/${category}`, { query, ...params });
  }

  async seasonDetail(endpoint, params = {}) {
    const data = await Promise.all([
      this.get(endpoint, params),
      this.get(`${endpoint}/videos`, params),
      this.get(`${endpoint}/images`, params),
    ]);
    return data;
  }
}
export default ApiService;

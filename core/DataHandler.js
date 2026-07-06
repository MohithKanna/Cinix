import dataFactory from "./DataFactory.js";
class DataHandler {
  constructor() {
    this.factory = dataFactory;
    this.dataForCard = this.factory.dataForCard;
  }
  _createPageBase(
    credits = {},
    details = {},
    images = {},
    videos = {},
    recommendations = {},
    type,
  ) {
    const releaseDate = details.release_date ?? details.first_air_date;
    const genres = this.factory.createGenreArr(details.genres, type);

    return {
      adult: details.adult ?? false,
      backdrops: this.factory.backdropsPath(images?.backdrops, 1280),
      companies: this.factory.createCompanyArr(details?.production_companies),
      count: details.vote_count ?? null,
      countries: this.factory.createCountryArr(details?.production_countries),
      credits: this.factory.createCreditsArr([
        ...credits?.cast,
        ...credits?.crew,
      ]),
      genres,
      homepage: details.homepage ?? null,
      id: details.id,
      languages: this.factory.createLangArr(details.spoken_languages),
      meta: { ...this.dataForCard(details), genres },
      ogLang: this.factory.getLang(details.original_language),
      overview: details.overview ?? null,
      popularity: this.factory.toFixedNumber(details?.popularity),
      poster: this.factory.getImgPath(details.poster_path, 1280),
      rating: this.factory.toFixedNumber(details?.vote_average),
      recommendations: this.factory.createRecommedationArr(
        recommendations?.results,
      ),
      releaseDate: this.factory.formatDate(releaseDate),
      softcore: details.softcore ?? false,
      status: details.status ?? null,
      tagline: details.tagline ?? null,
      title: details.title ?? details.name ?? null,
    };
  }
  dataForSuggestion(data) {
    let results;

    if (data?.results.length > 0) results = data?.results;
    else return [];

    const sortedAndSliced = results
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 7);

    const suggestions = sortedAndSliced.map((obj) => ({
      title: obj.title ?? obj.name ?? null,
      type: obj.media_type === "tv" ? "tv show" : (obj.media_type ?? null),
      image: this.factory.getImgPath(obj.poster_path, 92) ?? null,
    }));
    return suggestions;
  }
  _pageForCast(object) {
    const { combined_credits, details, images, movie_credits, tv_credits } =
      object;

    if (!details) return null;

    return {
      adult: details.adult ?? false,
      alsoKnownAs: details.also_known_as ?? [],
      birthday: this.factory.formatDate(details.birthday),
      credits: this.factory.filterKnowFor([
        ...combined_credits?.cast,
        ...combined_credits?.crew,
      ]),
      deathday: details.deathday
        ? this.factory.formatDate(details.deathday)
        : null,
      gender:
        details.gender === 1
          ? "Female"
          : details.gender === 2
            ? "Male"
            : "Unknown",

      homepage: details.homepage ?? null,
      id: details.id,
      imdbUrl: details.imdb_id
        ? `https://www.imdb.com/name/${details.imdb_id}`
        : null,
      knownForDepartment: details.known_for_department ?? "Acting",
      overview: details.biography ?? null,
      placeOfBirth: details.place_of_birth ?? null,
      popularity: this.factory.toFixedNumber(details?.popularity),
      poster: this.factory.getImgPath(details.profile_path, 780),
      posters: this.factory.backdropsPath(images?.profiles, 1280),

      title: details.name ?? null,
      type: "person",
    };
  }
  _pageForCompany(object) {
    const { details, movies, tv_shows } = object;

    return {
      headquarters: details.headquarters || null,
      homepage: details.homepage || null,
      id: details.id,
      movies: (movies?.results ?? [])
        .map((r) => this.factory.dataForCard(r))
        .filter(Boolean),
      originCountry: details.origin_country || null,
      overview: details.description || null,
      parentCompany: details.parent_company || null,
      poster: this.factory.getImgPath(details.logo_path, 500),
      title: details.name,

      totalMovies: movies?.total_results ?? 0,
      totalShows: tv_shows?.total_results ?? 0,
      tvShows: (tv_shows?.results ?? [])
        .map((r) => this.factory.dataForCard(r))
        .filter(Boolean),
      type: "company",
    };
  }
  _pageForEpisode(object) {
    const [details, videos, backdrops] = object;
    if (!object) return null;
    console.log(object);
    return {
      airDate: this.factory.formatDate(details?.air_date),
      backdrops: this.factory.backdropsPath(backdrops?.stills, 1280),
      castAndcrew: this.factory.createCreditsArr(
        [...details?.guest_stars, ...details?.crew] ?? [],
      ),
      episodeNumber: details?.episode_number,
      episodeType: details?.episode_type ?? null,
      id: details?.id,
      overview: details?.overview ?? null,
      rating: this.factory.toFixedNumber(details?.vote_average),
      runtime: this.factory.formatRuntime(details?.runtime),
      seasonNumber: details?.season_number,
      showId: details?.show_id,

      still: this.factory.getImgPath(details?.still_path, 1280),
      title: details?.name ?? null,
      type: "episode",
      videos: videos?.results ?? [],
    };
  }
  _pageForMovie(object) {
    const { credits, details, images, recommendations, videos } = object;
    const base = this._createPageBase(
      credits,
      details,
      images,
      videos,
      recommendations,
      "movie",
    );
    return {
      ...base,
      budget: this.factory.formatCurrency(details?.budget),
      revenue: this.factory.formatCurrency(details?.revenue),
      runtime: this.factory.formatRuntime(details?.runtime),
      type: "movie",
      videos: videos?.results ?? [],
    };
  }
  _pageForSeason(object) {
    const [details, videos, backdrops] = object;
    return {
      airDate: this.factory.formatDate(details.air_date),
      cast: this.factory.createSeasonCast(details.episodes ?? []),
      episodes: this.factory.createEpisodeCards(details.episodes ?? []),
      id: details?.id,
      networks: (details.networks ?? []).map((n) => ({
        id: n.id,
        logo: this.factory.getImgPath(n.logo_path, 500),
        name: n.name,
      })),
      overview: details.overview || null,
      poster: this.factory.getImgPath(details.poster_path, 780),
      posters: this.factory.backdropsPath(backdrops?.posters, 1280),
      rating: this.factory.toFixedNumber(details?.vote_average),
      seasonNumber: details.season_number,
      showId: details.episodes?.[0]?.show_id ?? null,
      title: details.name ?? null,
      type: "season",
      videos: videos?.results ?? [],
    };
  }
  _pageForTv(object) {
    const { credits, details, images, recommendations, videos } = object;
    const base = this._createPageBase(
      credits,
      details,
      images,
      videos,
      recommendations,
      "tv",
    );
    return {
      ...base,
      runtime:
        this.factory.calSeasonsAndEps(
          details?.number_of_seasons,
          details?.number_of_episodes,
        ) ?? null,
      seasons: this.factory.createSeasonCards(details?.seasons),
      videos: videos?.results ?? [],
      type: "tv",
    };
  }
  handleBackdrop(data = {}) {
    if (!data.id) return null;
    const releaseDate = data.release_date ?? data.first_air_date;
    return {
      backdrop: this.factory.getImgPath(data?.backdrop_path, 1280),
      genres: this.factory.createGenreArr(data?.genre_ids),
      id: data.id,
      overview: data.overview ?? null,
      rating: this.factory.toFixedNumber(data?.vote_average),
      releaseDate: this.factory.formatDate(releaseDate),
      title: data.title ?? data.name ?? null,
      type: data.name ? "tv" : "movie",
    };
  }
  handlePage(type, object) {
    if (type === "person") return this._pageForCast(object);
    if (type === "company") return this._pageForCompany(object);
    if (type === "movie") return this._pageForMovie(object);
    if (type === "tv") return this._pageForTv(object);
    if (type === "season") return this._pageForSeason(object);
    if (type === "episode") return this._pageForEpisode(object);
    return null;
  }
  setup = (setup) => {
    this.factory.setup(setup);
  };
}
const dataHandler = new DataHandler();
export default dataHandler;

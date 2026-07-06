import watchListPage from "./WatchListPage.js";
class CardFactory {
  _genresText(genres = []) {
    if (!Array.isArray(genres) || genres.length === 0) return "";
    return genres.slice(0, 2).map((genre) => {
      const span = document.createElement("span");
      span.classList.add("genre");
      span.textContent = genre.name + "  ";
      span.dataset.genreId = genre.id ?? "";
      span.dataset.genreType = genre.type ?? "";
      return span;
    });
  }

  _ratingClass(rating) {
    if (rating > 7) return "card-rating-high";
    if (rating > 4) return "card-rating-mid";
    return "card-rating-low";
  }

  buildCard = (data) => {
    if (!data) return null;
    if (data.type === "person") return this.castCard(data);
    const card = document.createElement("div");
    card.classList.add("card", "glass");

    card.dataset.id = data.id;
    card.dataset.type = data.type;
    const media = document.createElement("div");
    media.className = "card-media";

    const img = document.createElement("img");
    let url =
      data.type === "movie"
        ? "./assets/defaults/movie.png"
        : "./assets/defaults/tvShow.png";
    img.src = data.posterPath ?? url;
    if (data.posterSrcSet) {
      img.srcset = data.posterSrcSet;
      img.sizes = data.posterSizes ?? "200px";
    }
    img.loading = "lazy";
    img.alt = data.title ?? "poster";
    img.className = "card-img";

    media.append(img);

    const details = document.createElement("div");
    details.className = "card-details";

    const title = document.createElement("strong");
    title.className = "card-title";
    title.textContent = data.title ?? "Untitled";

    const rating = Number(data.rating ?? 0);

    const ratingEl = document.createElement("span");
    ratingEl.className = `card-rating ${this._ratingClass(rating)}`;
    ratingEl.textContent = Number.isFinite(rating)
      ? `★ ${rating.toFixed(1)}`
      : "N/A";

    let icon = document.createElement("img");
    icon.classList.add("card-icon");
    icon.alt = "watchlist-icon";
    if (watchListPage.has(data.id)) {
      icon.src = "assets/icons/checked-bookmark.svg";
      icon.dataset.inbookmark = true;
    } else {
      icon.src = "assets/icons/add-bookmark.svg";
    }

    const genres = document.createElement("p");
    genres.className = "card-genres-container ";

    const genreLinks = this._genresText(data.genres);

    if (Array.isArray(genreLinks)) {
      genreLinks.forEach((link) => genres.appendChild(link));
    }
    const meta = document.createElement("div");
    meta.className = "card-meta";

    meta.append(ratingEl, genres);

    details.append(title, ratingEl, icon, genres);

    card.append(media, details);

    return card;
  };

  castCard = (data) => {
    const { id, title, url } = data;
    if (!id || !title) return;
    const card = document.createElement("div");
    card.classList.add("cast-card");
    card.dataset.id = id;
    card.dataset.type = "person";
    const img = document.createElement("img");
    img.classList.add("cast-img");
    img.src = url || "./assets/defaults/profile.png";
    img.loading = "lazy";

    img.alt = title;
    const label = document.createElement("div");
    label.textContent = title;
    label.classList.add("cast-label");
    card.append(img, label);
    return card;
  };
}
const cardFactory = new CardFactory();
export default cardFactory;

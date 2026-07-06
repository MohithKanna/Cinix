class WatchListPage {
  constructor(storageKey = "CINIX_WATCHLIST") {
    this.storageKey = storageKey;
    this.page = document.getElementById("watchlist-page");
    this.items = this._loadFromStorage();
    this.lookupMap = new Map();
    this._initLookupMap();
    this._setupUi();
  }

  _setupUi() {
    try {
      const title = document.createElement("h1");
      title.classList.add("watchlist-page-title");
      title.textContent = "Your Watchlist";
      this.titleEl = title;

      const wrapper = document.createElement("div");
      wrapper.classList.add("watchlist-card-wrapper", "glass-heavy");
      wrapper.addEventListener("click", this.handleClick);

      this.container = wrapper;
      this.page.append(title, wrapper);
    } catch (err) {
      throw new Error("watchlist failed");
    }
  }
  _initLookupMap() {
    this.lookupMap.clear();
    this.items.forEach((item) => {
      this.lookupMap.set(String(item.cardId), item);
    });
  }

  processCardElement(cardEl) {
    if (!cardEl) return false;

    const cardId = String(cardEl.getAttribute("data-id") || cardEl.dataset.id);

    if (this.has(cardId)) {
      this.removeItem(cardId);
      return false;
    }
    const cardData = this._extractCardData(cardEl, cardId);

    this.lookupMap.set(cardId, cardData);
    this.items.push(cardData);

    this._localSaver(this.items);
    return true;
  }
  processPage(pageMeta) {
    if (!pageMeta) return false;

    const data = JSON.parse(pageMeta);
    const id = String(data.id);

    if (this.has(id)) {
      this.removeItem(id);
      return false;
    }

    const pageData = this._extractPageData(data);
    this.lookupMap.set(id, pageData);
    this.items.push(pageData);
    this._localSaver(this.items);

    return true;
  }

  removeItem(cardId) {
    if (this.has(cardId)) {
      const serializedId = String(cardId);
      this.lookupMap.delete(serializedId);
      this.items = this.items.filter(
        (item) => String(item.cardId) !== serializedId,
      );

      this._localSaver(this.items);
      this.renderView();
    }
  }

  has(cardId) {
    return this.lookupMap.has(String(cardId));
  }

  getItem(cardId) {
    return this.lookupMap.get(String(cardId)) || null;
  }

  getAll() {
    return this.items;
  }

  _extractPageData(data) {
    return {
      cardId: data.id,
      type: data.type,
      imageUrl: data.posterPath,
      posterSrcSet: data.posterSrcSet,
      posterSizes: data.posterSizes,
      cardName: data.title,
      rating: `★&nbsp` + data.rating.toFixed(1),
      genres: data.genres,
      timestamp: Date.now(),
    };
  }

  _extractCardData(cardEl, cardId) {
    const type =
      cardEl.getAttribute("data-type") || cardEl.dataset.type || "movie";
    const imageEl = cardEl.querySelector(".card-img");
    const imageUrl = imageEl?.src || "";
    const posterSrcSet = imageEl?.srcset || null;
    const posterSizes = imageEl?.sizes || null;
    const cardName =
      cardEl.querySelector(".card-title")?.textContent.trim() ||
      "Untitled Asset";
    const rating =
      cardEl.querySelector(".card-rating")?.textContent.trim() || "★ 0.0";

    const genreNodes = cardEl.querySelectorAll(".genre");
    const genres = Array.from(genreNodes).map((node) => ({
      id: node.getAttribute("data-genre-id") || node.dataset.genreId,
      type:
        node.getAttribute("data-genre-type") || node.dataset.genreType || type,
      name: node.textContent.trim(),
    }));

    return {
      cardId,
      type,
      imageUrl,
      posterSrcSet,
      posterSizes,
      cardName,
      rating,
      genres,
      timestamp: Date.now(),
    };
  }

  _localSaver(updatedItemsList) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updatedItemsList));
    } catch (err) {
      console.error("Watchlist storage allocation fault:", err);
    }
  }

  _loadFromStorage() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Watchlist initialization read fault:", err);
      return [];
    }
  }

  renderView() {
    if (!this.container) return;

    this.container.innerHTML = "";
    this.container.style.display = "flex";

    if (this.items.length === 0) {
      this.container.style.flexDirection = "column";
      this.container.style.minHeight = "70vh";
      this.container.style.justifyContent = "center";
      this.container.style.alignItems = "center";
      this.container.innerHTML = `<div class="empty-watchlist-container">
      <a href="#home"><img class="watch-list-main-img" src="./assets/icons/emptyWatchlist.svg" alt="watchlist-empty"></a>
      <h1>Your watchlist is empty. Add a movie to your watchlist!</h1>
      <a href="#home">Back to Home</a>
      </div>`;
      return;
    }

    const isOnline = navigator.onLine;
    const fragment = document.createDocumentFragment();
    this.container.style = "";

    this.items.forEach((item) => {
      const cardWrapper = document.createElement("div");

      if (isOnline) {
        cardWrapper.className = "card glass";
        cardWrapper.setAttribute("data-id", item.cardId);
        cardWrapper.setAttribute("data-type", item.type);

        const genresHtml = item.genres
          .map(
            (g) =>
              `<span class="genre" data-genre-id="${g.id}" data-genre-type="${g.type}">${g.name}</span>`,
          )
          .join(" ");

        cardWrapper.innerHTML = `
          <div class="card-media">
            <img src="${item.imageUrl}" alt="${item.cardName}" class="card-img" ${
              item.posterSrcSet ? `srcset="${item.posterSrcSet}"` : ""
            } ${item.posterSizes ? `sizes="${item.posterSizes}"` : ""} onerror="this.src='./assets/fallback.png'">
          </div>
          <div class="card-details">
          <img class="card-icon" src="assets/icons/checked-bookmark.svg" alt="added-bookmark">
            <strong class="card-title">${item.cardName}</strong>
            <span class="card-rating">${item.rating}</span>
            <p class="card-genres-container">${genresHtml}</p>
          </div>
        `;
      } else {
        this.container.classList.remove("watchlist-card-wrapper");
        this.container.classList.add("offline-mode");
        cardWrapper.setAttribute("data-id", item.cardId);

        const genreListText =
          item.genres.map((g) => g.name).join(", ") || "Uncategorized";

        cardWrapper.innerHTML = `
          <div data-id="${item.cardId}"class="offline-card glass">
          <h2 class="card-title">${item.cardName}</h2>
          <p>${item.type.toUpperCase()}</p>
          <p class="card-title"><span>Genres:</span> ${genreListText}</p>
          <button class="remove-offline-card">Remove</button>
          </div>
        `;
      }

      fragment.appendChild(cardWrapper);
    });
    this.container.appendChild(fragment);
  }
  _ratingClass(rating) {
    let num = Number(rating);
    if (num > 7) return "card-rating-high";
    if (num > 4) return "card-rating-mid";
    return "card-rating-low";
  }

  handleClick = (e) => {
    if (e.target.closest(".remove-offline-card")) {
      e.preventDefault();
      let card = e.target.closest(".offline-card");
      card.dataset.id && this.removeItem(card.dataset.id);
    }
  };
}
const watchListPage = new WatchListPage();
export default watchListPage;

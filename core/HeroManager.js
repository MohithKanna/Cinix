const overviews = [
  "Cinema is a matter of what's in the frame and what's out.",
  "The famous 'Oscar' nickname for the Academy Award of Merit was reportedly coined by a librarian who thought the statuette looked like her uncle.",
  "Every great film should seem new every time you see it.",
  "A cinematic masterpiece can start in just a handful of theaters before word-of-mouth turns it into a global cultural phenomenon.",
  "To make a great film, you need three things: the script, the script, and the script.",
  "The world's first public projection of moving images was hosted for an audience of just a few dozen people, changing history forever.",
  "If it can be written, or thought, it can be filmed.",
  "The first feature-length animated movie was created using tens of thousands of hand-drawn frames, paving the way for modern animation.",
  "Great cinema gives audiences a thrill—the same relief and pleasure they feel when waking up from a nightmare.",
  "The term 'blockbuster' originally described a production so successful that it literally 'busted' the blocks of competing lines.",
];
const ERROR = "Unable to connect. Please reconnect to the internet.";

class HeroManager {
  constructor(container, appServices, callback) {
    this.container = container;
    this.appServices = appServices;
    this.isTransitioning = false;
    this.index = -1;
    this.timeout = null;
    this.fallback = false;
    this.isActive = true;
    this.heroData = [];
    this.callback = callback;
    this.setup();
  }
  _reset = () => {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.current?.classList.remove("fade-out");
    this.next?.classList.remove("fade-in");
    this.hideTexts();
    this.isTransitioning = false;
  };
  endTransition = () => {
    this.current.classList.remove("fade-out");
    this.next.classList.remove("fade-in");
    this.hideTexts();

    [this.current, this.next] = [this.next, this.current];
    this.isTransitioning = false;
    if (!this.isActive) return;

    this.timeout = setTimeout(this.startTransition, 800);
  };
  errorContent(content = {}) {
    if (!content) content = this.getCurr();
    const [titleEl, meta, ratingEl, yearEl, overviewEl, btn] = this.textEl;
    titleEl.textContent = content.overview;
    overviewEl.innerHTML = `<strong>${ERROR}</strong>`;
  }

  getCurr = () => this.heroData[this.index];
  getNext = () => {
    if (!this.heroData?.length) return null;
    this.index = (this.index + 1) % this.heroData.length;
    return this.heroData[this.index];
  };
  getPrev = () => {
    if (!this.heroData?.length) return null;
    this.index = (this.index - 1 + this.heroData.length) % this.heroData.length;
    return this.heroData[this.index];
  };
  handleClick = (e) => {
    e.preventDefault();
    const id = e.target.id;

    if (id === "hero-next") {
      this._reset();

      this.startTransition("next");
    } else if (id === "hero-prev") {
      this._reset();
      this.startTransition("prev");
    } else if (id === "hero-details-btn" || e.target.closest("#hero-section")) {
      const curr = this.getCurr();
      if (curr?.id && curr?.type) {
        this.stop();
        this.callback(`#${curr.type}/${curr.id}`);
      }
    }
  };
  hideTexts = () => this.textEl.forEach((el) => el.classList.remove("show"));
  setup = async () => {
    this.backdrops = this.container.querySelectorAll(".hero-backdrop");
    [this.current, this.next] = this.backdrops;

    this.textEl = [
      document.getElementById("hero-title"),
      document.getElementById("hero-meta"),
      document.getElementById("hero-rating"),
      document.getElementById("hero-year"),
      document.getElementById("hero-overview"),
      document.getElementById("hero-details-btn"),
    ];
    try {
      const [topMovies, topShows] = await Promise.all([
        this.appServices.getBackdrops("movie", "top_rated"),
        this.appServices.getBackdrops("tv", "top_rated"),
      ]);

      const combined = [...topMovies, ...topShows];
      const seen = new Set();
      this.heroData = combined
        .filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        })
        .sort((a, b) => b.rating - a.rating);
    } catch (err) {
      this.fallback = true;

      document.getElementById("hero-details-btn").style.display = "none";
      document.getElementById("hero-meta").style.display = "none";

      this.heroData = overviews.map((overview, index) => ({
        backdrop: `./assets/defaults/backdrops/backdrop${index + 1}.png`,
        overview,
      }));
    }

    this.startTransition();
    this.container.addEventListener("click", this.handleClick);
  };

  showTexts = () =>
    this.textEl.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add("show");
      }, 100 * index);
    });

  startTransition = (moveTo = "next") => {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    const content = moveTo === "next" ? this.getNext() : this.getPrev();
    this.updateBackdrop(content);
    !this.fallback ? this.updateContent(content) : this.errorContent(content);
    this.showTexts();
    if (!this.isActive) return;
    this.timeout = setTimeout(this.endTransition, 5000);
  };

  stop = () => {
    this._reset();
    this.container.removeEventListener("click", this.handleClick);
    this.isActive = false;
  };

  restart = async () => {
    if (!this.backdrops || !this.heroData?.length || !this.textEl) {
      this.isActive = true;
      await this.setup();
      return;
    }

    this._reset();

    if (!this.isActive) {
      this.container.addEventListener("click", this.handleClick);
      this.isActive = true;
    }

    const content = this.getCurr();
    if (content) {
      this.updateBackdrop(content);
      !this.fallback ? this.updateContent(content) : this.errorContent(content);
      this.showTexts();
    }

    this.timeout = setTimeout(this.startTransition, 2000);
  };

  updateBackdrop = (content = {}) => {
    if (!content) content = this.getCurr();
    if (!content?.backdrop) return;
    this.next.style.backgroundImage = `url("${content.backdrop}")`;
    this.current.classList.add("fade-out");
    this.next.classList.add("fade-in");
  };

  updateContent = (content = {}) => {
    if (!content) content = this.getCurr();
    const [titleEl, meta, ratingEl, yearEl, overviewEl, btn] = this.textEl;
    titleEl.textContent = content?.title ?? "";
    overviewEl.textContent = content?.overview ?? "";
    ratingEl.textContent = content?.rating
      ? content.rating.toFixed(1) + " ★"
      : "";
    yearEl.textContent = content?.releaseDate ?? "";
  };
}
export default HeroManager;

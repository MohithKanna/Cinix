class CardStore {
  constructor() {
    this.store = new Map();
    this.storePage = new Map();
  }

  delete = (id) => {
    if (id) this.store.delete(id);
  };

  deletePage = (page) => {
    if (this.storePage.has(page)) {
      const arrOfId = this.storePage.get(page);
      for (let i = 0; i < arrOfId.length; i++) {
        const id = arrOfId[i];
        this.delete(id);
      }
      this.storePage.delete(page);
    }
  };

  get = (id) => {
    if (id) return this.store.get(id);
    return null;
  };

  getPage = (page) => {
    if (!page) return null;
    const arrOfIds = this.storePage.get(page);
    if (!arrOfIds) return null;
    const allExist = arrOfIds.every((id) => this.get(id));
    return allExist ? arrOfIds : null;
  };

  has = (id) => {
    return this.store.has(id) ? true : false;
  };

  set = (cardOrId, maybeCard) => {
    const card =
      cardOrId && typeof cardOrId === "object" && cardOrId.id
        ? cardOrId
        : maybeCard && typeof maybeCard === "object" && maybeCard.id
          ? maybeCard
          : null;

    if (card?.id) this.store.set(card.id, card);
  };

  setPage = (page, cards = []) => {
    const arrOfId = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      !this.has(card?.id) && this.set(card);
      card?.id && arrOfId.push(card.id);
    }
    this.storePage.set(page, [...arrOfId]);
  };
}
const cardStore = new CardStore();
export default cardStore;

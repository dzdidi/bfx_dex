const BTCUSD = require('./pairs/btcusd');

module.exports = class OrderFactory {
  constructor() {
    // TODO: pass something like user id?
    this.pairs = {
      BTCUSD,
      USDBTC: BTCUSD,
    };

    // TODO: for all pairs check if they implement the same interface
  }

  getOrder(pair) {
    return this.pairs[pair.toUpperCase()];
  }
};

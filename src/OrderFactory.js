const assert = require('node:assert');
const BTCUSD = require('./pairs/btcusd');

module.exports = class OrderFactory {
  constructor() {
    // TODO: pass something like user id?
    this.pairs = {
      BTCUSD,
      USDBTC: BTCUSD,
    };

    // sloppy but better than nothing enforcement of interface
    const publicMethods = [
      'toJSON',
      'toString',
      'getPrice',
      'getCounterPrice',
      'fill',
    ];

    Object.values(this.pairs).forEach((pair) => {
      publicMethods.forEach((method) => {
        assert(typeof pair.prototype[method] === 'function');
      });
    });
  }

  getOrder(pair) {
    return this.pairs[pair.toUpperCase()];
  }
};

const BigNumber = require('bignumber.js');

function subtractOrders(orderA, orderB) {
  // eslint-disable-next-line
  orderA.buyAmount = (new BigNumber(orderA.buyAmount)).minus(orderB.sellAmount).toFixed();
  // eslint-disable-next-line
  orderA.sellAmount = (new BigNumber(orderA.sellAmount)).minus(orderB.buyAmount).toFixed();
  // eslint-disable-next-line
  orderB.buyAmount = '0';
  // eslint-disable-next-line
  orderB.sellAmount = '0';
}

module.exports = class BTCUSD {
  constructor(param) {
    // TODO: add validation
    this.buyAsset = param.buyAsset.toUpperCase();
    this.buyAmount = param.buyAmount;
    this.sellAsset = param.sellAsset.toUpperCase();
    this.sellAmount = param.sellAmount;
  }

  toJSON() {
    return {
      buyAsset: this.buyAsset,
      sellAsset: this.sellAsset,
      buyAmount: this.buyAmount,
      sellAmount: this.sellAmount,
    };
  }

  toString() {
    return `${this.sellAmount}:${this.sellAsset}/${this.buyAmount}:${this.buyAsset}`;
  }

  toCounterString() {
    return this.toString().split('/').reverse().join('/');
  }

  // For the pair rates always need to be denominated in the same currency
  // regardless if it is buy or sell. Base unit of account must be the same
  getRate() {
    let btcAmount;
    let usdAmount;

    if (this.buyAsset === 'BTC') {
      btcAmount = new BigNumber(this.buyAmount);
      usdAmount = new BigNumber(this.sellAmount);
    } else {
      btcAmount = new BigNumber(this.sellAmount);
      usdAmount = new BigNumber(this.buyAmount);
    }

    // NOTE: rates precision depends on denomination
    // it might be better to operate with base denominations of each pair
    // meaning trade sats for cents instead of btc for usd
    return usdAmount.dividedBy(btcAmount).toFixed(2);
  }

  getPrice() {
    if (this.buyAsset === 'BTC') {
      return `${this.getRate()}:USD/1:BTC`;
    }
    return `1:BTC/${this.getRate()}:USD`;
  }

  getCounterPrice() {
    if (this.buyAsset === 'BTC') {
      return `1:BTC/${this.getRate()}:USD`;
    }
    return `${this.getRate()}:USD/1:BTC`;
  }

  // XXX: this function mutates both input parameter and instance properties
  fill(counterOrder) {
    if ((new BigNumber(this.buyAmount)).gte(counterOrder.sellAmount)) {
      subtractOrders(this, counterOrder);
    } else {
      subtractOrders(counterOrder, this);
    }
  }
};

const BigNumber = require('bignumber.js');

module.exports = class BTCUSD {
  constructor(param) {
    // TODO: add validation
    this.buyAsset = param.buyAsset;
    this.buyAmount = param.buyAmount;
    this.sellAsset = param.sellAsset;
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
    return usdAmount.dividedBy(btcAmount).toFixed(2);
  }
};

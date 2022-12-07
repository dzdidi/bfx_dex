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

  }
};

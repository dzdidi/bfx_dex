const { OrderFactory } = require('../index')

describe('btc/usd (usd/btc) order pair', () => {
  const orderFactory = new OrderFactory();
  const Order = orderFactory.getOrder('BTCUSD');

  const orderParam = {
    buyAsset: 'USD',
    buyAmount: '30000',
    sellAsset: 'BTC',
    sellAmount: '2'
  };

  it('constructs and serializes to/from object', () => {
    let order = new Order(orderParam)
    expect(order.toJSON()).toStrictEqual(orderParam)
  })
})

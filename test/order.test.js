const { OrderFactory } = require('../index');

describe('btc/usd (usd/btc) order pair', () => {
  const orderFactory = new OrderFactory();
  const Order = orderFactory.getOrder('BTCUSD');

  const orderParam = {
    buyAsset: 'USD',
    buyAmount: '30000',
    sellAsset: 'BTC',
    sellAmount: '2',
  };

  const counterOrderParam = {
    sellAsset: 'USD',
    sellAmount: '30000',
    buyAsset: 'BTC',
    buyAmount: '2',
  };

  const halfCounterOrderParam = {
    sellAsset: 'USD',
    sellAmount: '15000',
    buyAsset: 'BTC',
    buyAmount: '1',
  };

  it('constructs and serializes to/from object', () => {
    const order = new Order(orderParam);
    expect(order.toJSON()).toStrictEqual(orderParam);
  });

  it('returns exchange rate denominated in USD', () => {
    const order = new Order(orderParam);
    const counterOrder = new Order(counterOrderParam);

    expect(order.getRate()).toBe(counterOrder.getRate());
  });

  it('returns order price', () => {
    const order = new Order(orderParam);
    const counterOrder = new Order(counterOrderParam);

    expect(order.getPrice()).toBe(counterOrder.getCounterPrice());
    expect(order.getCounterPrice()).toBe(counterOrder.getPrice());
  });

  it('fills exact orders', () => {
    const order = new Order(orderParam);
    const counterOrder = new Order(counterOrderParam);

    order.fill(counterOrder);

    expect(order.buyAmount).toBe(counterOrder.sellAmount);
    expect(order.buyAmount).toBe('0');
    expect(order.sellAmount).toBe(counterOrder.buyAmount);
    expect(order.sellAmount).toBe('0');
  });

  it('fills partial orders', () => {
    const order = new Order(orderParam);
    const counterOrder = new Order(halfCounterOrderParam);

    order.fill(counterOrder);

    expect(order.buyAmount).toBe('15000');
    expect(order.sellAmount).toBe('1');

    expect(counterOrder.buyAmount).toBe('0');
    expect(counterOrder.sellAmount).toBe('0');
  });
});

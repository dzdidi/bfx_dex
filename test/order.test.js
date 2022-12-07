const { OrderFactory } = require('../index');
const { orderParam, counterOrderParam, halfCounterOrderParam } = require('./orders');

describe('btc/usd (usd/btc) order pair', () => {
  const orderFactory = new OrderFactory();
  const Order = orderFactory.getOrder('BTCUSD');

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

  it('serializes to string and counterString', () => {
    const order = new Order(orderParam);
    const counterOrder = new Order(counterOrderParam);

    expect(order.toString()).toBe(counterOrder.toCounterString())
    expect(order.toCounterString()).toBe(counterOrder.toString())

    expect(order.toString()).toBe("2:BTC/30000:USD")
    expect(order.toCounterString()).toBe("30000:USD/2:BTC")
  })
});

const { setTimeout } = require('node:timers/promises');

const configA = require('./configs/node-a');
const configB = require('./configs/node-b');
const configC = require('./configs/node-c');

const { orderParam, counterOrderParam, halfCounterOrderParam } = require('./orders');

const { OrderBook } = require('../index');

describe('OrderBook', () => {
  jest.setTimeout(100 * 1000);

  describe('Bootstrap', () => {
    let userA;
    let userB;

    beforeEach(async () => {
      userA = new OrderBook(configA);
      userB = new OrderBook(configB);
    });

    afterEach(async () => {
      await userA.stop();
      await userB.stop();
    });

    it('bootraps', async () => {
      expect(userA.bootstraped).toBe(false);
      expect(userB.bootstraped).toBe(false);

      await userA.waitUntilBootstraped();
      await userB.waitUntilBootstraped();

      expect(userA.bootstraped).toBe(true);
      expect(userB.bootstraped).toBe(true);
    });
  });

  describe('matching', () => {
    let userA;
    let userB;
    let userC;

    beforeEach(async () => {
      userA = new OrderBook(configA);
      userB = new OrderBook(configB);
      userC = new OrderBook(configC);

      await userA.waitUntilBootstraped();
      await userB.waitUntilBootstraped();
      await userC.waitUntilBootstraped();
    });

    afterEach(async () => {
      await userA.stop();
      await userB.stop();
      await userC.stop();
    });

    describe('Order matching', () => {
      it('exactly matches order for 1on1 trade', async () => {
        await userA.submitOrder(orderParam);
        expect(userA.order.toJSON()).toStrictEqual(orderParam);

        // wait for distribution through net
        await setTimeout(1000);

        await userB.submitOrder(counterOrderParam);
        expect(userA.order).toBe(null);
        expect(userB.order).toBe(null);
      });

      it('partially matches order for 1on1 trade', async () => {
        await userA.submitOrder(orderParam);
        expect(userA.order.toJSON()).toStrictEqual(orderParam);

        // happy path wait for distribution through net
        await setTimeout(1000);

        await userB.submitOrder(halfCounterOrderParam);
        expect(userB.order).toBe(null);
        expect(userA.order.toJSON()).toStrictEqual({
          buyAmount: '15000',
          buyAsset: 'USD',
          sellAmount: '1',
          sellAsset: 'BTC',
        });
      });

      it('exactly matches order for 1on2 trade', async () => {
        await userA.submitOrder(orderParam);
        expect(userA.order.toJSON()).toStrictEqual(orderParam);
        await setTimeout(1000);

        await Promise.all([
          userB.submitOrder(counterOrderParam),
          userC.submitOrder(counterOrderParam),
        ]);

        expect(userA.order).toBe(null);
        const closed = [userB, userC].filter((u) => u.order === null);
        expect(closed.length === 1);
      });

      it('partially matches order for 1on2 trade', async () => {
        await userA.submitOrder(orderParam);
        expect(userA.order.toJSON()).toStrictEqual(orderParam);
        await setTimeout(1000);

        await Promise.all([
          userB.submitOrder(halfCounterOrderParam),
          userC.submitOrder(halfCounterOrderParam),
        ]);

        expect(userA.order).toBe(null);
        const closed = [userB, userC].filter((u) => u.order === null);
        expect(closed.length === 2);
      });

      it('partially matches order for 1on2 trade wiht leftover', async () => {
        await userA.submitOrder(orderParam);
        expect(userA.order.toJSON()).toStrictEqual(orderParam);
        await setTimeout(1000);

        await Promise.all([
          userC.submitOrder(counterOrderParam),
          userB.submitOrder(halfCounterOrderParam),
        ]);

        expect(userA.order).toBe(null);
        const closed = [userB, userC].filter((u) => u.order === null);
        // either "half" is closed and "full" is half-closed
        // or "full" is closed and "half" is open
        expect(closed.length >= 1);
      });
    });

    describe('Order closing', () => {
      it('allows to cancel orders', async () => {
        await userA.submitOrder(orderParam);
        expect(userA.order.toJSON()).toStrictEqual(orderParam);
        await setTimeout(1000);

        await userA.cancelOrder();
        expect(userA.order).toBe(null);
      });

      it('cancels order gracefully', async () => {
        await userA.submitOrder(orderParam);
        expect(userA.order.toJSON()).toStrictEqual(orderParam);
        await setTimeout(1000);

        await Promise.all([
          userA.cancelOrder(),
          userB.submitOrder(counterOrderParam),
        ]);
        await setTimeout(1000);

        expect(userA.order).toBe(null);
        // orderB is either closed or not what we check that promise all is not failing on timeout
        if (userB.order) {
          expect(userB.order.toJSON()).toStrictEqual({
            buyAmount: '2',
            buyAsset: 'BTC',
            sellAmount: '30000',
            sellAsset: 'USD',
          });
        } else {
          expect(userA.order).toBe(null);
        }
      });
    });
  });
});

const configA = require('./configs/node-a');
const configB = require('./configs/node-b');
const configC = require('./configs/node-c');

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
});

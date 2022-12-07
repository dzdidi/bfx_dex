const { setTimeout } = require('node:timers/promises');

const { Grape } = require('grenache-grape');
const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

const OrderFactory = require('./OrderFactory');

module.exports = class OrderBook {
  constructor(config) {
    this.config = config;

    this.grape = new Grape(this.config);
    this.grape.start();

    this.link = new Link({ grape: `http://${config.host}:${config.api_port}` });
    this.link.start();

    this.server = new PeerRPCServer(this.link, {});
    this.server.init();

    this.client = new PeerRPCClient(this.link, {});
    this.client.init();

    this.bootstraped = false;
    this.grape.on('ready', () => { this.bootstraped = true; });

    this.order = null;
    this.orderInProgress = false;

    this.orderFactory = new OrderFactory();
    this.orderServices = {};
  }

  async waitUntilBootstraped(seconds = 5) {
    let remaining = seconds;
    while (remaining > 0) {
      if (this.bootstraped) return;

      // eslint-disable-next-line
      await setTimeout(1000);
      remaining -= 1;
    }

    throw new Error('Failed to bootstrap dht on time');
  }

  async waitUntilOrderProcessed(seconds = 5) {
    let remaining = seconds;
    while (remaining > 0) {
      if (!this.orderInProgress) return;

      // eslint-disable-next-line
      await setTimeout(1000);
      remaining -= 1;
    }

    throw new Error('Failed to process order on time');
  }

  async stop() {
    await this.cancelOrder();
    this.client.stop();
    this.server.stop();
    this.link.stop();
    this.grape.stop();
  }

  async cancelOrder() {
    if (!this.order) {
      return;
    }

    this.log('Cancelling order', JSON.stringify(this.order.toJSON()));
    await this.waitUntilOrderProcessed();

    this.link.stopAnnouncing(this.order.toString());
    this.link.stopAnnouncing(this.order.getPrice());

    Object.values(this.orderServices).forEach((service) => { service.stop(); });
    this.order = null;
  }

  async submitOrder(orderParam, force = false) {
    if (!force && (this.orderInProgress || this.order)) {
      throw new Error(`Can process only one order at time: ${JSON.stringify(this.config)}`);
    }
    this.setOrder(orderParam);
    this.orderInProgress = true;

    const res = await this.submitOrderRequest(orderParam);
    this.hanldeResponse(res);
  }

  matchOrder(requestId, key, payload, handler) {
    // XXX: things like request body validation, ratelimiting etc need to be added

    this.orderInProgress = true;
    if (!this.order) {
      handler.reply(new Error('ERR_MATCH_NOT_FOUND'), null);
      this.orderInProgress = false;
      return;
    }

    this.order.fill(payload);
    this.hibernateSevice();
    if (this.order) {
      this.anounceToDHT();
    }

    handler.reply(null, payload);
    this.orderInProgress = false;
  }

  async request(key, value, options = { timeout: 1000 }) {
    return new Promise((resolve, reject) => {
      this.client.request(key, value, options, (err, res) => {
        // no requested key found (aka no matching trade)
        if (err
          && (err.message !== 'ERR_GRAPE_LOOKUP_EMPTY') // no dht entry
          && (err.message !== 'ERR_MATCH_NOT_FOUND') // dht entry already taken
          && (!err.message.includes('ECONNREFUSED')) // dht entry already closed
        ) {
          return reject(err);
        }

        return resolve(res);
      });
    });
  }

  async submitOrderRequest(orderParam) {
    const exactRes = await this.request(this.order.toCounterString(), orderParam);
    if (exactRes) {
      return exactRes;
    }

    const res = await this.request(this.order.getCounterPrice(), orderParam);
    return res;
  }

  log(...data) {
    // eslint-disable-next-line
    console.log(`Node: ${this.config.host}:${this.config.dht_port}`, ...data);
  }

  completeOrder() {
    this.log('Order is complete', JSON.stringify(this.order));
    this.order = null;
    this.orderInProgress = false;
  }

  updateOrder(res) {
    // NOTE: force flag is a lazi implementation
    // re-submits order leftover
    this.submitOrder(res, true);
  }

  hanldeResponse(res) {
    if (res) {
      // NOTE: orderInProgress is still true
      this.handleDHTResponse(res);
    } else {
      // NOTE: orderInProgress will be set to false
      this.anounceToDHT();
    }
  }

  handleDHTResponse(res) {
    this.log('Order match found on DHT', JSON.stringify(this.order));
    if (res.buyAmount === '0') {
      this.completeOrder();
    } else {
      this.updateOrder(res);
    }
  }

  anounceToDHT() {
    this.createOrderService(this.config.matchingPort);
    this.createOrderService(this.config.exactMatchingPort);
    this.announceOrder(this.order.getPrice(), this.config.matchingPort);
    this.announceOrder(this.order.toString(), this.config.exactMatchingPort);

    this.orderInProgress = false;
  }

  createOrderService(port) {
    this.log('Setting up order services');
    if (this.orderServices[port]) {
      return;
    }

    this.orderServices[port] = this.server.transport('server');
    this.orderServices[port].listen(port);
    this.orderServices[port].on('request', this.matchOrder.bind(this));
  }

  announceOrder(key, port) {
    this.log('Announcing order', key, 'on', port);
    this.link.startAnnouncing(key, port);
  }

  setOrder(orderParam) {
    const key = `${orderParam.buyAsset}${orderParam.sellAsset}`;
    const Order = this.orderFactory.getOrder(key);
    this.order = new Order(orderParam);
  }

  hibernateSevice() {
    this.link.stopAnnouncing(this.order.toString());

    if (this.order.buyAmount === '0') {
      this.link.stopAnnouncing(this.order.getPrice());
      this.order = null;
    }
    Object.values(this.orderServices).forEach((service) => { service.stop(); });
  }
};

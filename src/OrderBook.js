const { Grape } = require('grenache-grape');
const { PeerRPCServer, PeerRPCClient } = require('grenache-nodejs-http');
const Link = require('grenache-nodejs-link');

const { setTimeout } = require('node:timers/promises');

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
  }

  async waitUntilBootstraped(seconds = 5) {
    let remaining = seconds;
    while (remaining > 0) {
      if (this.bootstraped) return;

      // eslint-disable-next-line
      await setTimeout(1000);
      remaining -= 1;
    }
  }

  async waitUntilOrderProcessed(seconds = 5) {
    let remaining = seconds;
    while (remaining > 0) {
      if (!this.order) return;

      // eslint-disable-next-line
      await setTimeout(1000);
      remaining -= 1;
    }
  }

  async stop() {
    await this.waitUntilOrderProcessed();
    this.client.stop();
    this.server.stop();
    this.link.stop();
    this.grape.stop();
  }

  submitOrder() {
    // TODO: move to constructor OR do this only if lookup failed
    // this.orderService = this.server.transport('server');
    // this.orderService.listen(this.config.service_port);
    // this.orderService.on('request', this.matchOrder);
  }

  matchOrder() {}
};

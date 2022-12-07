# Idea
Use DHT as a matching engine. Each node runs own DHT instance. When user wants to trade they submit requests to DHT: 
1. Lookup exact order match and complete operation if one found and filled
2. Lookup up by exchange rate and if our order closed completely - complete. Retry with leftover.
3. If not match found - start announcing by both exact order and by price.

## NOTE:
1. Orders do not have ids, which will be necessary for storing trades history
2. Orders do not have userIds, ideally orders and trades also need to be signed

# Assumptions:
1. Clients balance handling lays outside of the scope of this task
2. One trade pair implementation is sufficient
3. Orders matched on the equal price without spread
4. User can have one open order (per pair?) at time

## Warning: There are missing data validations, ratelimitings and other MUST HAVE practices

# Trade-offs:

- Current implementation is restricted to single pair: `BTCUSD`. However, new pairs can be added as separate classes inside `./src/pairs/` and included into `./src/OrderFactory.js`). Then it will also be recommended to create separate order book instance for each pair (sharding). For this, config paramter needs to be extended specifying the trading pair for particular order book;

- Order matched are at exact prices. Price slippage within configurable `delta` can be implemented via starting from lowest acceptable price (`price - delta`) and lookup matches with arbitrary picked increment either until match is found or until `price + delta` reached. Then fallback to announcing on `price` level. Order's `fill` method will need to be changed to incorporate this while 'trade' should benefit announcing side (Maker / Taker);

- User can make a trade only for one order at time. This restriction is possible to overcome by removing restriction within `OrderBook.submitOrder()` and calling `OrderBook.createOrderService` for each new order. This in turn will create new service to listen to request therefore port allocation is necessary; It may also be necessary in this case to make sure users do not trade against themselves. 

- While DHT supports storing data, for balance and historical trades to be stored on DHT it might require adding consensus for sequence of trades.

# TODO:
## OrderBook
- [x] initialize grenache for each client
- [x] methods for order submission
- [x] methods for remaining order re-creation
- [x] cancel order
- [x] exact order matching as a first priority

- [ ] store / retrieve history (can store closed orders on dht but makes sense with signature only)

## OrderFactory
- [x] implement (to show how new pairs can be added)
- [x] interface enforcement

## Order
- [x] order creation
- [x] exchange rate calculation
- [x] order inversion (for exact order matching)
- [x] serialization / deserializaiton

# USAGE:

Install dependencies:
```
npm install
```

Run tests:
```
npm run test
```

Run lint:
```
npm run lint
```

Example of use:

```js
const config = {
  host: '127.0.0.1',
  dht_port: 20001,
  dht_bootstrap: ['127.0.0.1:20002'],
  api_port: 30001,
  matchingPort: 8001,
  exactMatchingPort: 8011,
};

const orderBook = new OrderBook(config);
await orderBook.waitUntilBootstraped();

await orderBook.submitOrder({
  buyAsset: 'USD',
  buyAmount: '30000',
  sellAsset: 'BTC',
  sellAmount: '2',
});
// one can access order by orderBook.order. If order is closes this property will be null

//... for more examples see `test/orderbook.test.js`

// await orderBook.cancelOrder(); // for cancelling pending order
await orderBook.stop(); // for gracefull shutdown (will cancel pending orders)
```

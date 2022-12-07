# Assumptions:

1. Clients balance handling lays outside of the scope of this task
2. One trade pair implementation is sufficient
3. Orders matched on the equal price without spread
4. User can have one open order (per pair?) at time

# Idea
Use DHT as a matching engine., Each node runs own DHT instance. When user wants to trade they submit request to DHT with exchange rate as defined by their inversed order. If there is a match - orders get filled. If there is no entry for this price on DHT, user's node begins announcing.

# Trade-offs:

- Current implementation is restricted to single pair: `BTCUSD`. However, new pairs can be added as separate classes inside `./src/pairs/` and included into `./src/OrderFactory.js`). Then it will also be recommended to create separate order book instance for each pair (sharding). For this, config paramter needs to be extended specifying the trading pair for particular order book;

- Order matched are at exact prices. Price slippage within configurable `delta` can be implemented via starting from lowest acceptable price (`price - delta`) and lookup matches with arbitrary picked increment either until match is found or until `price + delta` reached. Then fallback to announcing on `price` level. Order's `fill` method will need to be changed to incorporate this while 'trade' should benefit announcing side (Maker / Taker);

- User can make a trade only for one order at time. This restriction is possible to overcome by removing restriction within `OrderBook.submitOrder()` and calling `OrderBook.createOrderService` for each new order. This in turn will create new service to listen to request therefore port allocation is necessary; It may also be necessary in this case to make sure users do not trade against themselves. 

- While DHT supports storing data, for balance and historical trades to be stored on DHT it might require adding consensus for sequence of trades.

- Exact order matching is not prioritized

# TODO:
## OrderBook
- [x] initialize grenache for each client
- [x] methods for order submission
- [x] methods for remaining order re-creation
- [x] cancel order
- [x] exact order matching as a first priority

- [ ] store / retrieve history (can store closed orders on dht but need makes sense with signature only)

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





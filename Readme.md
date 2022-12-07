# Assumptions:

1. Clients balance handling lays outside of the scope of this task
2. One trade pair implementation is sufficient
3. Orders matched on the equal price without spread
4. User can have one open order (per pair?) at time


# Idea
Use DHT as a matching engine. When user wants to trade they submit request to DHT
with exchange rate as defined by their inversed order. If there is a match -
orders get filled. If there is no entry for this price on DHT, user's node begins
announcing


# TODO:
## OrderBook
- [x] initialize grenache for each client
- [ ] methods for order submission
- [ ] methods for remaining order re-creation

- [ ] store / retrieve history
- [ ] create orders according to users balance

## Order
- [ ] order creation
- [ ] exchange rate calculation
- [ ] order inversion
- [ ] serialization / deserializaiton

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





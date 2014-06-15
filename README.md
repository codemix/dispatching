# Dispatching


URL routing library for node.js and the browser.

## Installation

```
npm install dispatching
```

## Usage

```js
var dispatcher = new Dispatcher();

dispatcher.add('/<controller>/<id:\\d+>/<action>', function (params) {
  return params;
});

dispatcher.add('/<controller>/<id:\\d+>', function (params) {
  return params;
});

dispatcher.add('/<controller>', function (params) {
  return params;
});

dispatcher.dispatch('/users/123/update').should.eql({
  controller: 'users',
  action: 'update',
  id: 123
});

dispatcher.dispatch('/users/123').should.eql({
  controller: 'users',
  id: 123
});

dispatcher.dispatch('/users').should.eql({
  controller: 'users'
});

```


## License

MIT, see [LICENSE.md](./LICENSE.md)


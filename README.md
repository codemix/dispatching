# Dispatching

[![Build Status](https://travis-ci.org/codemix/dispatching.svg)](https://travis-ci.org/codemix/dispatching)

URL routing library for node.js and the browser.

## Installation

```
npm install dispatching
```

## Usage

```js
var dispatcher = new Dispatcher();

dispatcher.add('/<controller>/<id:\\d+>/<action>', function (params) {
  console.log(params);
  return params;
});

dispatcher.dispatch('/users/123/update').should.eql({
  controller: 'users',
  action: 'update',
  id: 123
});

```


## License

MIT, see [LICENSE.md](./LICENSE.md)


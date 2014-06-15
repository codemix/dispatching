var expect = require('expect.js');
require('should');

var Dispatching = require('../lib');

describe('Dispatching', function () {
  var dispatcher;

  describe('match()', function () {
    beforeEach(function () {
      dispatcher = new Dispatching([
        ['/', returnArg],
        ['/<first>/<second>/', returnArg]
      ]);
    });

    it('should match the first rule', function () {
      dispatcher.match('/').should.eql([{}, returnArg]);
    });

    it('should match the second rule', function () {
      dispatcher.match('/a/test').should.eql([
        {
          first: 'a',
          second: 'test'
        },
        returnArg
      ]);
    });
  });

  describe('dispatch()', function () {
    var identity = {};
    beforeEach(function () {
      dispatcher = new Dispatching({routes: [
        ['#<hash>', returnArg],
        ['/', returnArg],
        {
          pattern: '/<file>',
          urlSuffix: '.html',
          fn: function (params) {
            return params.file;
          }
        },
        ['/<controller:(\\w+)>', returnArg]
      ]});
      dispatcher.add('/<controller>/<action>', function (params) {
        identity.controller = params.controller;
        identity.action = params.action;
        return identity;
      });
      dispatcher.add('/<controller>/<action>/<id>', returnArg);
    });
    it('should match empty paths', function () {
      dispatcher.dispatch('/').should.eql({});
    });
    it('should match empty paths, with full URLs', function () {
      dispatcher.dispatch('https://example.com/').should.eql({});
    });

    it('should match hashes', function () {
      dispatcher.dispatch('/#hash').should.eql({hash: 'hash'});
    });
    it('should match hashes, with full URLs', function () {
      dispatcher.dispatch('https://example.com/#hash').should.eql({hash: 'hash'});
    });
    it('should match routes', function () {
      dispatcher.dispatch('/foo/bar').should.equal(identity);
      identity.controller.should.equal('foo');
      identity.action.should.equal('bar');
    });
    it('should match routes, with full URLs', function () {
      dispatcher.dispatch('http://example.com/foo/bar').should.equal(identity);
      dispatcher.dispatch('http://example.com/foo/bar?wat=true').should.equal(identity);
      identity.controller.should.equal('foo');
      identity.action.should.equal('bar');
    });
    it('should reject urls without matches', function () {
      dispatcher.dispatch('/123').should.equal.false;
      dispatcher.dispatch('/123/123/123/123').should.equal.false;
    });
    it('should reject urls without matches, with full URLS', function () {
      dispatcher.dispatch('http://example.com/123').should.equal.false;
    });
    it('should match url suffices', function () {
      dispatcher.dispatch('/hello.html').should.equal('hello');
      dispatcher.dispatch('/hello.txt').should.not.equal('hello');
    });
    it('should match url suffices, with full URLs', function () {
      dispatcher.dispatch('http://example.com/hello.html').should.equal('hello');
      dispatcher.dispatch('http://example.com/hello.html?wat=foo').should.equal('hello');;
    });
    it('should match the the first rule', function () {
      dispatcher.dispatch('/greeting').should.eql({controller: 'greeting'});
    });
    it('should match the the first rule, with full URLs', function () {
      dispatcher.dispatch('http://example.com/greeting').should.eql({controller: 'greeting'});
      dispatcher.dispatch('http://example.com/greeting?hello').should.eql({controller: 'greeting'});
    });
  });

});


function returnArg (arg) { return arg; }
"use strict";

var t = require('chai').assert;
var sit = require('../../');
var request = require('supertest');

var car = {
  name: 'Tesla',
  start: function () {
    console.log(start);
  },
  _private_method: function () {

  }
};

describe('facets/jsonrpc', function () {

  describe('server', function () {
    it('should setup methods', function (done) {
      var injector = sit.injector({
        car: car,
        server: sit.facets.jsonrpc.server('car')
      }, {
        server: {
          host: 'localhost',
          port: '6100',
          signing: {
            sign: true,
            secret: 'secret007'
          }
        }
      });

      var server = injector.get('server');
      t.ok(server.methods);
      t.isFunction((server.methods['car.start']));
      t.notOk(server.methods['_private_method']);
      t.notOk(server.methods['name']);
      server.$promise.then(function () {
        server.httpServer.close(done);
      });
    });

    it('should listen', function (done) {
      var injector = sit.injector({
        car: car,
        server: sit.facets.jsonrpc.server('car')
      }, {
        server: {
          host: 'localhost',
          port: '6100',
          signing: {
            sign: true,
            secret: 'secret007'
          }
        }
      });

      var server = injector.get('server');
      server.$promise.then(function (app) {
        request(app)
          .get('/status')
          .expect(200)
          .expect({status: 'ok'})
          .end(function (err) {
            if (err) throw err;
            server.httpServer.close(done);
          });
      });
    });
  });

  describe('client', function () {
    it('should setup client', function () {
      var injector = sit.injector({
        client: sit.facets.jsonrpc.client()
      }, {
        client: {
          host: 'localhost',
          port: '6100',
          signing: {
            sign: true,
            secret: 'secret007'
          }
        }
      });
      var client = injector.get('client');
      t.ok(client.client);
    });
  });

  describe.only('integration', function () {
    it('should execute for client request', function (done) {
      var answer;
      var foo = {
        bar: function (msg) {
          answer = msg;
          return 'pong';
        }
      };

      var serverInjector = sit.injector({
        foo: foo,
        server: sit.facets.jsonrpc.server('foo')
      }, {
        server: {
          host: 'localhost',
          port: '6100',
          signing: {
            sign: true,
            secret: 'secret007'
          }
        }
      });
      var server = serverInjector.get('server');

      var clientInjector = sit.injector({
        foo: sit.facets.jsonrpc.client()
      }, {
        foo: {
          host: 'localhost',
          port: '6100',
          signing: {
            sign: true,
            secret: 'secret007'
          }
        }
      });
      var fooClient = clientInjector.get('foo');

      server.$promise.then(function () {
        fooClient.request('bar', 'ping').then(function (response) {
          t.equal(answer, 'ping');
          t.equal(response, 'pong');
          done();
        });
      });
    });
  });

});
'use strict';

let ctxToContext = (() => {
  var _ref = _asyncToGenerator(function* (ctx) {
    const authHeader = ctx.request.header.authentication;
    if (!authHeader || !/Bearer .+/.exec(authHeader)) {
      return {};
    }
    const token = authHeader.substr(7).trim();
    const currentUser = yield (0, _auth.cachedTokenToUser)(token);
    return { currentUser };
  });

  return function ctxToContext(_x) {
    return _ref.apply(this, arguments);
  };
})();

let onConnect = (() => {
  var _ref2 = _asyncToGenerator(function* (connectionParams) {
    if (!connectionParams.authToken) {
      return {};
    }
    const currentUser = yield (0, _auth.cachedTokenToUser)(connectionParams.authToken);
    if (!currentUser) {
      return {};
    }
    return {
      currentUser
    };
  });

  return function onConnect(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _koaBodyparser = require('koa-bodyparser');

var _koaBodyparser2 = _interopRequireDefault(_koaBodyparser);

var _apolloServerKoa = require('apollo-server-koa');

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _schema = require('./graphql/schema');

var _schema2 = _interopRequireDefault(_schema);

var _subscriptionsTransportWs = require('subscriptions-transport-ws');

var _graphql = require('graphql');

var _cors = require('@koa/cors');

var _cors2 = _interopRequireDefault(_cors);

var _auth = require('./auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const app = new _koa2.default();
const router = new _koaRouter2.default();
app.use((0, _cors2.default)());
app.use((0, _koaBodyparser2.default)());

router.post('/graphql', (() => {
  var _ref3 = _asyncToGenerator(function* (ctx, next) {
    return (0, _apolloServerKoa.graphqlKoa)({ schema: _schema2.default, context: yield ctxToContext(ctx) })(ctx, next);
  });

  return function (_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
})());
router.get('/graphql', (() => {
  var _ref4 = _asyncToGenerator(function* (ctx, next) {
    return (0, _apolloServerKoa.graphqlKoa)({ schema: _schema2.default, context: yield ctxToContext(ctx) })(ctx, next);
  });

  return function (_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
})());

// Setup the /graphiql route to show the GraphiQL UI
router.get('/graphiql', (0, _apolloServerKoa.graphiqlKoa)({
  endpointURL: '/graphql',
  subscriptionsEndpoint: 'ws://localhost:3000/subscriptions'
}));

app.use(router.routes());
app.use(router.allowedMethods());
const server = app.listen(_config2.default.port);

// eslint-disable-next-line no-new
new _subscriptionsTransportWs.SubscriptionServer({
  execute: _graphql.execute,
  subscribe: _graphql.subscribe,
  onConnect,
  schema: _schema2.default
}, {
  path: '/subscriptions',
  server
});
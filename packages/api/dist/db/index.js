'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userThangChanges = exports.thangBookingChanges = exports.deleteThangCollection = exports.deleteThang = exports.deleteBooking = exports.userCollections = exports.thangBookings = exports.thangOwners = exports.collectionOwners = exports.collectionThangs = exports.userThangs = exports.userFromEmail = exports.updateUser = exports.createUser = exports.createBooking = exports.createThangCollection = exports.createThang = exports.booking = exports.thangCollection = exports.thang = exports.user = undefined;

var _asyncGenerator = function () { function AwaitValue(value) { this.value = value; } function AsyncGenerator(gen) { var front, back; function send(key, arg) { return new Promise(function (resolve, reject) { var request = { key: key, arg: arg, resolve: resolve, reject: reject, next: null }; if (back) { back = back.next = request; } else { front = back = request; resume(key, arg); } }); } function resume(key, arg) { try { var result = gen[key](arg); var value = result.value; if (value instanceof AwaitValue) { Promise.resolve(value.value).then(function (arg) { resume("next", arg); }, function (arg) { resume("throw", arg); }); } else { settle(result.done ? "return" : "normal", result.value); } } catch (err) { settle("throw", err); } } function settle(type, value) { switch (type) { case "return": front.resolve({ value: value, done: true }); break; case "throw": front.reject(value); break; default: front.resolve({ value: value, done: false }); break; } front = front.next; if (front) { resume(front.key, front.arg); } else { back = null; } } this._invoke = send; if (typeof gen.return !== "function") { this.return = undefined; } } if (typeof Symbol === "function" && Symbol.asyncIterator) { AsyncGenerator.prototype[Symbol.asyncIterator] = function () { return this; }; } AsyncGenerator.prototype.next = function (arg) { return this._invoke("next", arg); }; AsyncGenerator.prototype.throw = function (arg) { return this._invoke("throw", arg); }; AsyncGenerator.prototype.return = function (arg) { return this._invoke("return", arg); }; return { wrap: function (fn) { return function () { return new AsyncGenerator(fn.apply(this, arguments)); }; }, await: function (value) { return new AwaitValue(value); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

let init = (() => {
  var _ref = _asyncToGenerator(function* (conn) {
    const tables = yield _rethinkdb2.default.tableList().run(conn);
    yield Promise.all(requiredTables.map(function (t) {
      return tables.indexOf(t) >= 0 ? null : _rethinkdb2.default.tableCreate(t).run(conn);
    }));
    return conn;
  });

  return function init(_x) {
    return _ref.apply(this, arguments);
  };
})();

let user = exports.user = (() => {
  var _ref2 = _asyncToGenerator(function* (id) {
    return yield _rethinkdb2.default.table('users').get(id).run((yield connectionP));
  });

  return function user(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

let thang = exports.thang = (() => {
  var _ref3 = _asyncToGenerator(function* (id) {
    return yield _rethinkdb2.default.table('thangs').get(id).run((yield connectionP));
  });

  return function thang(_x3) {
    return _ref3.apply(this, arguments);
  };
})();

let thangCollection = exports.thangCollection = (() => {
  var _ref4 = _asyncToGenerator(function* (id) {
    return yield _rethinkdb2.default.table('thangCollections').get(id).run((yield connectionP));
  });

  return function thangCollection(_x4) {
    return _ref4.apply(this, arguments);
  };
})();

let booking = exports.booking = (() => {
  var _ref5 = _asyncToGenerator(function* (id) {
    return yield _rethinkdb2.default.table('bookings').get(id).run((yield connectionP));
  });

  return function booking(_x5) {
    return _ref5.apply(this, arguments);
  };
})();

let createThang = exports.createThang = (() => {
  var _ref6 = _asyncToGenerator(function* (args) {
    const { generated_keys: [id] } = yield _rethinkdb2.default.table('thangs').insert(_extends({}, args, { created: Date.now() })).run((yield connectionP));
    return id;
  });

  return function createThang(_x6) {
    return _ref6.apply(this, arguments);
  };
})();

let createThangCollection = exports.createThangCollection = (() => {
  var _ref7 = _asyncToGenerator(function* ({ owners, name }) {
    const { generated_keys: [id] } = yield _rethinkdb2.default.table('thangCollections').insert({ owners, name, created: Date.now() }).run((yield connectionP));
    return id;
  });

  return function createThangCollection(_x7) {
    return _ref7.apply(this, arguments);
  };
})();

let createBooking = exports.createBooking = (() => {
  var _ref8 = _asyncToGenerator(function* ({ owner, from, to, thang }) {
    const { generated_keys: [id] } = yield _rethinkdb2.default.table('bookings').insert({ owner, from, to, thang, created: Date.now() }).run((yield connectionP));
    return id;
  });

  return function createBooking(_x8) {
    return _ref8.apply(this, arguments);
  };
})();

let createUser = exports.createUser = (() => {
  var _ref9 = _asyncToGenerator(function* (profile) {
    const { generated_keys: [id] } = yield _rethinkdb2.default.table('users').insert(_extends({}, profile, { created: Date.now() })).run((yield connectionP));
    return id;
  });

  return function createUser(_x9) {
    return _ref9.apply(this, arguments);
  };
})();

let updateUser = exports.updateUser = (() => {
  var _ref10 = _asyncToGenerator(function* (id, profile) {
    const res = yield _rethinkdb2.default.table('users').get('id').update(_extends({}, profile, { updated: Date.now() })).run((yield connectionP));
    return { updated: res.replaced };
  });

  return function updateUser(_x10, _x11) {
    return _ref10.apply(this, arguments);
  };
})();

let userFromEmail = exports.userFromEmail = (() => {
  var _ref11 = _asyncToGenerator(function* (email) {
    const res = yield _rethinkdb2.default.table('users').filter(_rethinkdb2.default.row('email').eq(email)).limit(1).run((yield connectionP));
    const [user] = yield res.toArray();
    return user || null;
  });

  return function userFromEmail(_x12) {
    return _ref11.apply(this, arguments);
  };
})();

let userThangs = exports.userThangs = (() => {
  var _ref12 = _asyncToGenerator(function* (id) {
    const res = yield _rethinkdb2.default.table('thangs').filter(_rethinkdb2.default.row('owners').contains(id)).run((yield connectionP));
    return yield res.toArray();
  });

  return function userThangs(_x13) {
    return _ref12.apply(this, arguments);
  };
})();

let collectionThangs = exports.collectionThangs = (() => {
  var _ref13 = _asyncToGenerator(function* (id) {
    const res = yield _rethinkdb2.default.table('thangs').filter(_rethinkdb2.default.row('collection').eq(id)).run((yield connectionP));
    return yield res.toArray();
  });

  return function collectionThangs(_x14) {
    return _ref13.apply(this, arguments);
  };
})();

let collectionOwners = exports.collectionOwners = (() => {
  var _ref14 = _asyncToGenerator(function* (id) {
    return _rethinkdb2.default.table('thangCollections').get(id).do(function (col) {
      return col('owners').map(function (id) {
        return _rethinkdb2.default.table('users').get(id);
      });
    }).run((yield connectionP));
  });

  return function collectionOwners(_x15) {
    return _ref14.apply(this, arguments);
  };
})();

let thangOwners = exports.thangOwners = (() => {
  var _ref15 = _asyncToGenerator(function* (id) {
    return _rethinkdb2.default.table('thangs').get(id).do(function (col) {
      return col('owners').map(function (id) {
        return _rethinkdb2.default.table('users').get(id);
      });
    }).run((yield connectionP));
  });

  return function thangOwners(_x16) {
    return _ref15.apply(this, arguments);
  };
})();

let thangBookings = exports.thangBookings = (() => {
  var _ref16 = _asyncToGenerator(function* (id) {
    const res = yield _rethinkdb2.default.table('bookings').filter(_rethinkdb2.default.row('thang').eq(id)).run((yield connectionP));
    return res.toArray();
  });

  return function thangBookings(_x17) {
    return _ref16.apply(this, arguments);
  };
})();

let userCollections = exports.userCollections = (() => {
  var _ref17 = _asyncToGenerator(function* (id) {
    const res = yield _rethinkdb2.default.table('thangCollections').filter(_rethinkdb2.default.row('owners').contains(id)).run((yield connectionP));
    return yield res.toArray();
  });

  return function userCollections(_x18) {
    return _ref17.apply(this, arguments);
  };
})();

let deleteBooking = exports.deleteBooking = (() => {
  var _ref18 = _asyncToGenerator(function* (id) {
    const { deleted } = yield _rethinkdb2.default.table('bookings').get(id).delete().run((yield connectionP));
    return deleted;
  });

  return function deleteBooking(_x19) {
    return _ref18.apply(this, arguments);
  };
})();

let deleteThang = exports.deleteThang = (() => {
  var _ref19 = _asyncToGenerator(function* (id) {
    const { deleted } = yield _rethinkdb2.default.table('thangs').get(id).delete().run((yield connectionP));
    return deleted;
  });

  return function deleteThang(_x20) {
    return _ref19.apply(this, arguments);
  };
})();

let deleteThangCollection = exports.deleteThangCollection = (() => {
  var _ref20 = _asyncToGenerator(function* (id) {
    const { deleted } = yield _rethinkdb2.default.table('thangCollections').get(id).delete().run((yield connectionP));
    return deleted;
  });

  return function deleteThangCollection(_x21) {
    return _ref20.apply(this, arguments);
  };
})();

let feedGenerator = (() => {
  var _ref21 = _asyncGenerator.wrap(function* (feed) {
    while (true) {
      const v = yield _asyncGenerator.await(feed.next());
      yield v;
    }
  });

  return function feedGenerator(_x22) {
    return _ref21.apply(this, arguments);
  };
})();

let thangBookingChanges = exports.thangBookingChanges = (() => {
  var _ref22 = _asyncToGenerator(function* (thang) {
    const res = yield _rethinkdb2.default.table('bookings').filter(_rethinkdb2.default.row('thang').eq(thang)).changes({ includeTypes: true }).run((yield connectionP));
    return feedGenerator(res);
  });

  return function thangBookingChanges(_x23) {
    return _ref22.apply(this, arguments);
  };
})();

let userThangChanges = exports.userThangChanges = (() => {
  var _ref23 = _asyncToGenerator(function* (user) {
    const res = yield _rethinkdb2.default.table('thangs').filter(_rethinkdb2.default.row('owners').contains(user)).changes({ includeTypes: true }).run((yield connectionP));
    return feedGenerator(res);
  });

  return function userThangChanges(_x24) {
    return _ref23.apply(this, arguments);
  };
})();

var _rethinkdb = require('rethinkdb');

var _rethinkdb2 = _interopRequireDefault(_rethinkdb);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const connectionP = _rethinkdb2.default.connect(_config2.default.rethink).then(init);

const requiredTables = ['users', 'bookings', 'thangs', 'thangCollections'];
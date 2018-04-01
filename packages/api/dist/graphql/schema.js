'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CustomError = undefined;

var _asyncGenerator = function () { function AwaitValue(value) { this.value = value; } function AsyncGenerator(gen) { var front, back; function send(key, arg) { return new Promise(function (resolve, reject) { var request = { key: key, arg: arg, resolve: resolve, reject: reject, next: null }; if (back) { back = back.next = request; } else { front = back = request; resume(key, arg); } }); } function resume(key, arg) { try { var result = gen[key](arg); var value = result.value; if (value instanceof AwaitValue) { Promise.resolve(value.value).then(function (arg) { resume("next", arg); }, function (arg) { resume("throw", arg); }); } else { settle(result.done ? "return" : "normal", result.value); } } catch (err) { settle("throw", err); } } function settle(type, value) { switch (type) { case "return": front.resolve({ value: value, done: true }); break; case "throw": front.reject(value); break; default: front.resolve({ value: value, done: false }); break; } front = front.next; if (front) { resume(front.key, front.arg); } else { back = null; } } this._invoke = send; if (typeof gen.return !== "function") { this.return = undefined; } } if (typeof Symbol === "function" && Symbol.asyncIterator) { AsyncGenerator.prototype[Symbol.asyncIterator] = function () { return this; }; } AsyncGenerator.prototype.next = function (arg) { return this._invoke("next", arg); }; AsyncGenerator.prototype.throw = function (arg) { return this._invoke("throw", arg); }; AsyncGenerator.prototype.return = function (arg) { return this._invoke("return", arg); }; return { wrap: function (fn) { return function () { return new AsyncGenerator(fn.apply(this, arguments)); }; }, await: function (value) { return new AwaitValue(value); } }; }();

let noop = (() => {
  var _ref = _asyncGenerator.wrap(function* () {
    yield _asyncGenerator.await(new Promise(function () {}));
  });

  return function noop() {
    return _ref.apply(this, arguments);
  };
})();

var _db = require('../db');

var _graphqlTools = require('graphql-tools');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const typeDefs = [`

type DateTime {
  hour: Int
  minute: Int
  day: Int
  month: Int
  year: Int
}

type User {
  id: ID!
  name: String!
  givenName: String,
  familyName: String,
  thangs: [Thang]!
  picture: String!
  collections: [ThangCollection]!
  email: String!
  timezone: String!
}
type ThangCollection {
  id: ID!
  name: String!
  thangs: [Thang]!
  owners: [User]!
}

input DateTimeInput {
  hour: Int
  minute: Int
  day: Int
  month: Int
  year: Int
}

input ListBookingsInput {
  from: DateTimeInput
  to: DateTimeInput
}

type Thang {
  id: ID!
  name: String!
  owners: [User]!
  bookings(input: ListBookingsInput): [Booking]!
  collection: ThangCollection
  timezone: String!
}
type Booking {
  id: ID!
  from: DateTime!
  to: DateTime!
  owner: User!
  thang: Thang!
}
type Query {
  thang(id: ID!): Thang
  user(id: ID!): User
  me: User
}

type DeleteResult {
  deleted: Int
}

type Mutation {
  createBooking(thang: ID!, from: DateTimeInput!, to: DateTimeInput!): Booking!
  createThang(name: String!, timezone: String): Thang!
  createThangCollection(name: String!): ThangCollection!
  deleteThang(id: ID!): DeleteResult!
  deleteBooking(id: ID!): DeleteResult!
  deleteThangCollection(id: ID!): DeleteResult!
}

type ChangeBooking {
  add: Booking
  remove: Booking
  change: Booking
}

type ChangeThang {
  add: Thang
  remove: Thang
  change: Thang
}


type Subscription {
  bookingsChange(thang: ID!, input: ListBookingsInput): ChangeBooking!
  myThangsChange: ChangeThang!
}

schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}`];

class CustomError extends Error {

  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

exports.CustomError = CustomError;
const resolvers = {
  Subscription: {
    bookingsChange: {
      resolve: v => {
        const { type, new_val: newVal, old_val: oldVal } = v;
        switch (type) {
          case 'add':
            return {
              add: newVal
            };
          case 'remove':
            return {
              remove: oldVal
            };
          case 'change':
            return {
              change: newVal
            };
        }
      },
      subscribe: (ctx, { thang }) => (0, _db.thangBookingChanges)(thang) // TODO use from and to
    },
    myThangsChange: {
      resolve: v => {
        const { type, new_val: newVal, old_val: oldVal } = v;
        switch (type) {
          case 'add':
            return {
              add: newVal
            };
          case 'remove':
            return {
              remove: oldVal
            };
          case 'change':
            return {
              change: newVal
            };
        }
      },
      subscribe: (ctx, { thang }, { currentUser }) => {
        if (!currentUser) {
          return noop(); // TODO is this the right way?!
        }
        return (0, _db.userThangChanges)(currentUser.id);
      }
    }
  },
  Booking: {
    thang({ thang: t }) {
      return _asyncToGenerator(function* () {
        return (0, _db.thang)(t);
      })();
    },
    owner({ owner }) {
      return _asyncToGenerator(function* () {
        return (0, _db.user)(owner);
      })();
    }
  },
  Query: {
    thang(ctx, { id }) {
      return _asyncToGenerator(function* () {
        return (0, _db.thang)(id);
      })();
    },
    user(ctx, { id }) {
      return (0, _db.user)(id);
    },
    me(ctx, args, { currentUser }) {
      return currentUser;
    }
  },

  User: {
    thangs({ id }) {
      return _asyncToGenerator(function* () {
        return (0, _db.userThangs)(id);
      })();
    },
    collections({ id }) {
      return _asyncToGenerator(function* () {
        return yield (0, _db.userCollections)(id);
      })();
    },
    email({ email }, args, { currentUser }) {
      return _asyncToGenerator(function* () {
        return currentUser && currentUser.email === email ? email : null;
      })();
    }
  },
  Thang: {
    collection({ collection }) {
      return _asyncToGenerator(function* () {
        return collection ? yield (0, _db.thangCollection)(collection) : null;
      })();
    },
    bookings({ id }) {
      return _asyncToGenerator(function* () {
        return (0, _db.thangBookings)(id); // TODO use to and from
      })();
    },
    owners({ id }) {
      return _asyncToGenerator(function* () {
        return yield (0, _db.thangOwners)(id);
      })();
    }
  },
  ThangCollection: {
    thangs({ id }) {
      return _asyncToGenerator(function* () {
        return yield (0, _db.collectionThangs)(id);
      })();
    },
    owners({ id }) {
      return _asyncToGenerator(function* () {
        return yield (0, _db.collectionOwners)(id);
      })();
    }
  },
  Mutation: {
    createBooking(ctx, args, { currentUser }) {
      return _asyncToGenerator(function* () {
        if (!currentUser) {
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN');
        }
        const id = yield (0, _db.createBooking)({ from: args.from, to: args.to, owner: currentUser.id, thang: args.thang });
        return (0, _db.booking)(id);
      })();
    },
    createThang(ctx, args, { currentUser }) {
      return _asyncToGenerator(function* () {
        if (!currentUser) {
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN');
        }
        const id = yield (0, _db.createThang)({
          name: args.name,
          owners: [currentUser.id],
          collection: null,
          timezone: currentUser.timezone
        });
        return (0, _db.thang)(id);
      })();
    },
    createThangCollection(ctx, args, { currentUser }) {
      return _asyncToGenerator(function* () {
        if (!currentUser) {
          throw new CustomError('User not logged in', 'USER_NOT_LOGGED_IN');
        }
        const id = yield (0, _db.createThangCollection)({ name: args.name, owners: [currentUser.id], thangs: [] });
        return (0, _db.thangCollection)(id);
      })();
    },
    deleteBooking(ctx, { id }) {
      return _asyncToGenerator(function* () {
        const deleted = yield (0, _db.deleteBooking)(id);
        return { deleted };
      })();
    },
    deleteThang(ctx, { id }) {
      return _asyncToGenerator(function* () {
        const deleted = yield (0, _db.deleteThang)(id);
        return { deleted };
      })();
    },
    deleteThangCollection(ctx, { id }) {
      return _asyncToGenerator(function* () {
        const deleted = yield (0, _db.deleteThangCollection)(id);
        return { deleted };
      })();
    }
  }
};

exports.default = (0, _graphqlTools.makeExecutableSchema)({ typeDefs, resolvers });
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cachedTokenToUser = exports.tokenToUser = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

let verify = (() => {
  var _ref = _asyncToGenerator(function* (token) {
    const key = yield getKey();
    return new Promise(function (resolve) {
      _jsonwebtoken2.default.verify(token, key, {
        algorithms: ['RS256'],
        audience: 'https://api.thang.io/',
        issuer: 'https://thang.eu.auth0.com/'
      }, function (err) {
        return resolve(!err);
      });
    });
  });

  return function verify(_x) {
    return _ref.apply(this, arguments);
  };
})();

let fetchProfile = (() => {
  var _ref2 = _asyncToGenerator(function* (token) {
    const { body } = yield _superagent2.default.get('https://thang.eu.auth0.com/userinfo').set('Authorization', `Bearer ${token}`);
    if (!isObject(body)) {
      return null;
    }
    const {
      name,
      nickname,
      sub: userId,
      picture,
      email,
      email_verified: emailVerified,
      given_name: givenName,
      family_name: familyName
    } = body;
    if (!isString(name) || !isString(nickname) || !isString(userId) || !isString(picture) || !isString(email) || !isBoolean(emailVerified) || givenName !== undefined && !isString(givenName) || familyName !== undefined && !isString(familyName)) {
      return null;
    }
    return {
      name,
      nickname,
      userId,
      picture,
      email,
      emailVerified,
      givenName: givenName || null,
      familyName: familyName || null
    };
  });

  return function fetchProfile(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

let createOrUpdateUser = (() => {
  var _ref3 = _asyncToGenerator(function* (profile) {
    const user = yield (0, _db.userFromEmail)(profile.email);
    if (user) {
      yield (0, _db.updateUser)(user.id, profile);
      return user.id;
    }
    const timezone = 'Europe/Copenhagen';
    return yield (0, _db.createUser)(_extends({}, profile, { timezone }));
  });

  return function createOrUpdateUser(_x3) {
    return _ref3.apply(this, arguments);
  };
})();

let tokenToUser = exports.tokenToUser = (() => {
  var _ref4 = _asyncToGenerator(function* (token) {
    const valid = yield verify(token);
    if (!valid) {
      return null;
    }
    const profile = yield fetchProfile(token);
    if (!profile) {
      return null;
    }
    const id = yield createOrUpdateUser(profile);
    return (0, _db.user)(id);
  });

  return function tokenToUser(_x4) {
    return _ref4.apply(this, arguments);
  };
})();

let cachedTokenToUser = exports.cachedTokenToUser = (() => {
  var _ref5 = _asyncToGenerator(function* (token) {
    const cached = cache.get(token);
    if (cached) {
      return cached;
    }
    const user = yield tokenToUser(token);
    if (!user) {
      return user;
    }
    cache.set(token, user);
    return user;
  });

  return function cachedTokenToUser(_x5) {
    return _ref5.apply(this, arguments);
  };
})();

var _jwksRsa = require('jwks-rsa');

var _jwksRsa2 = _interopRequireDefault(_jwksRsa);

var _jsonwebtoken = require('jsonwebtoken');

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _jwkToPem = require('jwk-to-pem');

var _jwkToPem2 = _interopRequireDefault(_jwkToPem);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _db = require('./db');

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const cache = (0, _lruCache2.default)({
  max: 3000
});

const jwksConfig = {
  strictSsl: true,
  jwksUri: 'https://thang.eu.auth0.com/.well-known/jwks.json'
};

const client = (0, _jwksRsa2.default)(jwksConfig);

function getKey() {
  return new Promise((resolve, reject) => {
    client.getKeys((err, data) => {
      if (err) {
        return reject(err);
      }
      if (!data[0]) {
        return;
      }
      resolve((0, _jwkToPem2.default)(data[0]));
    });
  });
}

function isObject(a) {
  return typeof a === 'object' && !!a;
}

function isString(a) {
  return typeof a === 'string';
}

function isBoolean(a) {
  return typeof a === 'boolean';
}
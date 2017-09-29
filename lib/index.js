'use strict';

var _require = require('./utils'),
    concat = _require.concat,
    invoke = _require.invoke,
    uniqueId = _require.uniqueId;

var dict = Object.create(null);

var wrapValue = function wrapValue(value) {
  if (value && value._cancelableValue) {
    return value;
  }

  return { type: 'VALUE', value: value };
};

var handleValue = function handleValue(rawValue, typeHandlers) {
  var value = wrapValue(rawValue);
  return typeHandlers[value.type](value);
};

var next = function next(token, res, err) {
  var needle = dict[token];
  if (!needle) return;

  var it = needle.it;

  var _ref = err ? it.throw(err) : it.next(res),
      rawValue = _ref.value,
      done = _ref.done;

  var value = handleValue(rawValue, {
    VALUE: function VALUE(_ref2) {
      var value = _ref2.value;
      return value;
    },
    STEP: function STEP(_ref3) {
      var fn = _ref3.fn,
          cancel = _ref3.cancel;

      needle.steps = concat(needle.steps, cancel);
      return fn();
    }
  });

  if (done) {
    delete dict[token];
    return;
  }

  return Promise.resolve(value).then(function (response) {
    return next(token, response);
  }).catch(function (err) {
    return next(token, null, err);
  });
};

var create = function create(it) {
  var token = uniqueId();
  dict[token] = { it: it, steps: [] };
  next(token);
  return token;
};

var cancelable = function cancelable(gen, context) {
  return create(gen.call(context));
};

cancelable.wrap = function (gen, context) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return create(gen.apply(context, args));
  };
};

cancelable.cancel = function (token) {
  var needle = dict[token];
  if (!needle) return;

  var _dict$token = dict[token],
      steps = _dict$token.steps,
      it = _dict$token.it;

  steps.forEach(invoke);
  it.return();
  delete dict[token];
};

cancelable.step = function (step) {
  return function () {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var _callback = void 0;
    var onCancel = function onCancel(callback) {
      return _callback = callback;
    };

    return {
      _cancelableValue: true,
      type: 'STEP',
      cancel: function cancel() {
        _callback && _callback();
        _callback = null;
      },
      fn: function fn() {
        return step(onCancel).apply(undefined, args);
      }
    };
  };
};

cancelable.latest = function (gen, context) {
  var run = cancelable.wrap(gen, context);
  var token = void 0;
  return function () {
    cancelable.cancel(token);
    token = run.apply(undefined, arguments);
    return token;
  };
};

module.exports = cancelable;
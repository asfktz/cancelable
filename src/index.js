const { concat, invoke, uniqueId } = require('./utils');

const dict = Object.create(null);

const wrapValue = value => {
  if (value && value._cancelableValue) {
    return value;
  }

  return { type: 'VALUE', value: value };
};

const handleValue = (rawValue, typeHandlers) => {
  const value = wrapValue(rawValue);
  return typeHandlers[value.type](value);
};

const next = (token, res, err) => {
  const needle = dict[token];
  if (!needle) return;

  const { it } = needle;

  const { value: rawValue, done } = err ? it.throw(err) : it.next(res);

  const value = handleValue(rawValue, {
    VALUE: ({ value }) => value,
    STEP: ({ fn, cancel }) => {
      needle.steps = concat(needle.steps, cancel);
      return fn();
    }
  });

  if (done) {
    delete dict[token];
    return;
  }

  return Promise.resolve(value)
    .then(response => {
      return next(token, response);
    })
    .catch(err => next(token, null, err));
};

const create = it => {
  const token = uniqueId();
  dict[token] = { it, steps: [] };
  next(token);
  return token;
};

const cancelable = (gen, context) => create(gen.call(context));

cancelable.wrap = (gen, context) => (...args) =>
  create(gen.apply(context, args));

cancelable.cancel = token => {
  const needle = dict[token];
  if (!needle) return;

  const { steps, it } = dict[token];
  steps.forEach(invoke);
  it.return();
  delete dict[token];
};

cancelable.step = step => (...args) => {
  let _callback;
  const onCancel = callback => (_callback = callback);

  return {
    _cancelableValue: true,
    type: 'STEP',
    cancel: () => {
      _callback && _callback();
      _callback = null;
    },
    fn: () => step(onCancel)(...args)
  };
};

cancelable.latest = (gen, context) => {
  const run = cancelable.wrap(gen, context);
  let token;
  return (...args) => {
    cancelable.cancel(token);
    token = run(...args);
    return token;
  };
};

module.exports = cancelable;
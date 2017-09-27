# cancelable

```js
const next = (it, res, err) => {
  const { value, done } = err ? it.throw(err) : it.next(res);

  if (done) return;

  return Promise.resolve(value)
    .then(res => next(it, res))
    .catch(err => next(it, null, err));
};

const create = (it) => {
  next(it);
  return () => it.return();
}

const cancelable = (gen, context) => create(gen.call(context));

cancelable.wrap = (gen, context) => (...args) =>
  create(gen.apply(context, args));

module.exports = cancelable;
```

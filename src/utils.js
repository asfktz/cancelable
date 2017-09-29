const uniqueId = (i => key => `'cancelable_'${++i}`)(0);
const concat = Array.prototype.concat.bind([]);
const invoke = fn => fn();

module.exports = { uniqueId, concat, invoke }

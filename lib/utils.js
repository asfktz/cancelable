"use strict";

var uniqueId = function (i) {
  return function (key) {
    return "'cancelable_'" + ++i;
  };
}(0);
var concat = Array.prototype.concat.bind([]);
var invoke = function invoke(fn) {
  return fn();
};

module.exports = { uniqueId: uniqueId, concat: concat, invoke: invoke };
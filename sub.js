var Sub = function (auto, sub) {
      this.auto = auto
      this.sub = sub
    }

Sub.prototype.get = function (key, opts, callback) {
  this.sub.get(key, opts, callback)
}

Sub.prototype.del = function (key, opts, callback) {
  this.auto.del(this.sub.prefix(key), opts, callback)
}

Sub.prototype.put = function (key, value, opts, callback) {
  this.auto.put(this.sub.prefix(key), value, opts, callback)
}

Sub.prototype.sublevel = function (name) {
  return new Sub(this.auto, this.sub.sublevel(name))
}

Sub.prototype.createReadStream = function (opts) {
  return this.sub.createReadStream(opts)
}

Sub.prototype.createKeyStream = function (opts) {
  return this.sub.createKeyStream(opts)
}

Sub.prototype.createValueStream = function (opts) {
  return this.sub.createValueStream(opts)
}

module.exports = Sub
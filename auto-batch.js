var AutoBatch = function (db) {
      if (!(this instanceof AutoBatch))
        return new AutoBatch(db)

      this.db = db
      this.batch = null
      this.callbacks = null
    }
  , Sub = require('./sub')

AutoBatch.prototype._prepare = function () {
  var self = this

  if (this.batch === null) {
    this.batch = this.db.batch()
    this.callbacks = []
    process.nextTick(function () {
      var callbacks = self.callbacks

      self.batch.write(function (err) {
        callbacks.forEach(function (callback) {
          callback(err)
        })
      })
      self.callbacks = null
      self.batch = null
    })
  }  
}

AutoBatch.prototype.get = function (key, opts, callback) {
  this.db.get(key, opts, callback)
}

AutoBatch.prototype.del = function (key, opts, callback) {
  this._prepare()

  if (!callback) {
    callback = opts
    opts = {}
  }

  this.batch.del(key, opts)
  this.callbacks.push(callback)
}

AutoBatch.prototype.put = function (key, value, opts, callback) {
  this._prepare()

  if (!callback) {
    callback = opts
    opts = {}
  }

  this.batch.put(key, value, opts)
  this.callbacks.push(callback)
}

AutoBatch.prototype.sublevel = function (name) {
  return new Sub(this, this.db.sublevel(name))
}

AutoBatch.prototype.createReadStream = function (opts) {
  return this.db.createReadStream(opts)
}

AutoBatch.prototype.createKeyStream = function (opts) {
  return this.db.createKeyStream(opts)
}

AutoBatch.prototype.createValueStream = function (opts) {
  return this.db.createValueStream(opts)
}

module.exports = AutoBatch
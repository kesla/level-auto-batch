var AutoBatch = function (db) {
      if (!(this instanceof AutoBatch))
        return new AutoBatch(db)

      this.db = db
      this.batch = null
      this.callbacks = null
    }
  , Sub = function (auto, sub) {
      this.auto = auto
      this.sub = sub
    }

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

Sub.prototype.del = function (key, opts, callback) {
  this.auto.del(this.sub.prefix(key), opts, callback)
}

Sub.prototype.put = function (key, value, opts, callback) {
  this.auto.put(this.sub.prefix(key), value, opts, callback)
}

Sub.prototype.sublevel = function (name) {
  return new Sub(this.auto, this.sub.sublevel(name))
}

module.exports = AutoBatch
var AutoBatch = function (db) {
      if (!(this instanceof AutoBatch))
        return new AutoBatch(db)

      this.db = db
      this.batch = null
      this.callbacks = null
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

module.exports = AutoBatch
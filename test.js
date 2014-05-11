var test = require('tap').test
  , level = require('level-test')()
  , subLevel = require('level-sublevel')

  , AutoBatch = require('./auto-batch')

test('unit test', function (t) {
  t.plan(4)

  var batch = []
    , db = {
        batch: function () {
          return {
              del: function (key) {
                batch.push({
                    key: key
                  , type: 'del'
                })
              }
            , put: function (key, value) {
                batch.push({
                    key: key
                  , value: value
                  , type: 'put'
                })
              }
            , write: function (callback) {
                t.deepEqual(
                    batch
                  , [
                        { key: 'foo', value: 'bar', type: 'put' }
                      , { key: 'hello', type: 'del' }
                    ]
                )
                callback()
              }
          }
        }
      }
    , auto = AutoBatch(db)

  auto.put('foo', 'bar', function () {
    t.pass()
  });

  auto.del('hello', function () {
    t.pass()
  })

  process.nextTick(function () {
    t.deepEqual(
        batch
      , [
            { key: 'foo', value: 'bar', type: 'put' }
          , { key: 'hello', type: 'del' }
        ]
    )
    t.end()
  })
})

test('integration test', function (t) {
  var db = level('integration')
    , auto = AutoBatch({
          batch: function () {
            return db.batch()
          }
      })

  t.plan(2)

  db.put('hello', 'world', function () {

    auto.put('foo', 'bar', function () {
      db.get('foo', function (err, value) {
        t.equal(value, 'bar')
      })

      db.get('hello', function (err) {
        t.ok(err.notFound)
      })
    });

    auto.del('hello', function () {})

  })
})

test('sublevel support', function (t) {
  var db = subLevel(level('sublevel-test'))
    , auto = AutoBatch(db)

  t.plan(3)

  auto.sublevel('foo').put('bar', 'OMG', function () {
    db.sublevel('foo').get('bar', function (err, value) {
      t.equal(value, 'OMG')
    })

    db.get('bas', function (err, value) {
      t.equal(value, 'ZING')
    })

    db.sublevel('one').sublevel('two').get('hej', function (err, value) {
      t.equal(value, 'hopp')
    })
  })

  auto.put('bas', 'ZING', function () {})

  auto.sublevel('one').sublevel('two').put('hej', 'hopp', function () {})
})

test('get and streams', function (t) {
  t.plan(8)

  var db = subLevel(level('get-streams'))
    , auto = AutoBatch(db)
    , sub = auto.sublevel('child')

  auto.put('foo', 'bar', function () {
    auto.get('foo', function (err, val) {
      t.equal(val, 'bar')
    })

    auto.createReadStream()
      .once('data', function (obj) {
        t.deepEqual(obj, { key: 'foo', value: 'bar' })
      })

    auto.createKeyStream()
      .once('data', function (key) {
        t.equal(key, 'foo')
      })

    auto.createValueStream()
      .once('data', function (val) {
        t.equal(val, 'bar')
      })
  })

  sub.put('hello', 'world', function () {
    sub.get('hello', function (err, val) {
      t.equal(val, 'world')
    })

    sub.createReadStream()
      .once('data', function (obj) {
        t.deepEqual(obj, { key: 'hello', value: 'world' })
      })

    sub.createKeyStream()
      .once('data', function (key) {
        t.equal(key, 'hello')
      })

    sub.createValueStream()
      .once('data', function (val) {
        t.equal(val, 'world')
      })
  })
})
var test = require('tap').test
  , level = require('level-test')()

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
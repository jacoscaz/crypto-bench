var args = process.argv.slice(2)
var lib = args.shift() || 'node'
var alg = args.shift() || 'sha1'
var length = parseInt(args.shift() || (alg == 'sha256' ? 32 : 20))
var libs = {
  'pbkdf2.js': function (key, salt, iterations, length) {
    
  },
  node : function (alg) {
    return function (key, salt, iterations, length) {
      return require('crypto').pbkdf2Sync(key, salt, iterations, length).toString('hex')
    }
  },

  forge: function (alg) {
    var forge = require('forge')
    return function (key, salt, iterations, length) {
      var hash = alg == 'sha256' ? forge.md.sha256.create() : null
      return new Buffer(forge.pbkdf2(key, salt, iterations, length, hash), 'binary').toString('hex')
    }
  },

  'crypto-js': function (alg) {
    var cjs = require('crypto-js')
    return function (key, salt, iterations, length) {
      return cjs.PBKDF2(key, salt, {
        iterations: iterations,
        keySize    : length / 4,
        hasher    : cjs.algo[alg.toUpperCase()]
      }).toString()
    }
  },

  sjcl: function (alg) {
    return function (key, salt, iterations, length) {
      var sjcl = require('sjcl/core')
      return sjcl.codec.hex.fromBits(sjcl.misc.pbkdf2(key, salt, iterations, length*8,
        alg == 'sha1' ? function (key) { return new sjcl.misc.hmac(key, sjcl.hash.sha1) } : null
      ))
    }
  }

}

var M = 10*1000
var prev = 0
var pbk = libs[lib](alg)

for(var i = 0; i <= 80; i++) {
  var n = Math.round(Math.pow(Math.pow(M, 1/80), i))
  if(n === prev) continue;
  prev = n
  var start = Date.now(), end, _hash, j = 0
  do {
    _hash = pbk('whatever', 'salty', n, length)
    end = Date.now()
    j++
  } while(end - start < 100)
  var time = end - start

  //if the first argument is a string,
  //console.log doesn't quote things
  console.log(''+i, n, j, time, (n*j)/time, _hash)
}

/**
 * Module dependencies.
 */

var 
  mongoose = require('mongoose'),
  async = require('async'),
  Image = mongoose.model('Image'),
  User = mongoose.model('User');

exports.run = function (done) {
  async.parallel([
    function (cb) {
      Image.collection.remove(cb)
    },
    function (cb) {
      User.collection.remove(cb)
    }
  ], done)
}
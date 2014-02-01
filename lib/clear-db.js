/**
 * Module dependencies.
 */

var 
	mongoose = require('mongoose'),
	async = require('async'),
	Content = mongoose.model('Content'),
	User = mongoose.model('User');

/**
 * Clear database
 */

exports.clearDb = function (done) {
  async.parallel([
    function (cb) {
      Content.collection.remove(cb);
    },
    function (cb) {
      User.collection.remove(cb);
    }
  ], done)
}
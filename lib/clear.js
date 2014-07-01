
/**
 * Module dependencies.
 */

var 
  fs = require('fs'),
  mongoose = require('mongoose'),
  async = require('async'),
  Image = mongoose.model('Image'),
  User = mongoose.model('User');

imagesUploadPath = __dirname + '/../public/uploads/images';

exports.database = function (done) {
  async.parallel([
    function (cb) {
      Image.collection.remove(cb)
    },
    function (cb) {
      User.collection.remove(cb)
    }
  ], done)
}

exports.imagefiles = function (done) {

  // list all files at image upload folder
  fs.readdir(imagesUploadPath, function(err, files){
    if (err) return done(err);
    
    // delete each file
    async.each(files, function(file, cb){
      fs.unlink(imagesUploadPath+'/'+file, cb);
    }, done);
  });
}

exports.all = function(done) {
  
  var self = this;

  async.parallel([self.database, self.imagefiles], done);
}
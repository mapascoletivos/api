const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const async = require('async');
const Image = mongoose.model('Image');
const User = mongoose.model('User');
const imagesUploadPath = path.join(__dirname, '..', 'public', 'uploads');

exports.database = function (done) {
  async.parallel(
    [
      function (cb) {
        Image.collection.remove(cb);
      },
      function (cb) {
        User.collection.remove(cb);
      }
    ],
    done
  );
};

exports.imagefiles = function (done) {
  // list all files at image upload folder
  fs.readdir(imagesUploadPath, function (err, files) {
    if (err) return done(err);

    // delete each file
    async.each(
      files,
      function (file, cb) {
        if (!file.endsWith('.gitignore')) {
          fs.unlink(imagesUploadPath + '/' + file, cb);
        } else cb();
      },
      done
    );
  });
};

exports.all = function (done) {
  var self = this;

  async.parallel([self.database, self.imagefiles], done);
};

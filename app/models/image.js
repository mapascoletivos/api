const path = require('path');
const async = require('async');
const fs = require('fs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { saveImage } = require('../../lib/images');

/**
 * Config
 */

const imagesPath = path.join(__dirname, '..', '..', 'public', 'uploads');

/**
 * Layer schema
 */

var ImageSchema = new Schema({
  creator: { type: Schema.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
  files: {
    thumb: String,
    mini: String,
    default: String,
    large: String
  }
});

/**
 * Hooks
 */

ImageSchema.pre('remove', function (next) {
  var self = this;

  async.each(
    ['thumb', 'mini', 'default', 'large'],
    function (size, doneEach) {
      fs.unlink(path.join(imagesPath, self.files[size]), doneEach);
    },
    next
  );
});

ImageSchema.pre('save', async function () {
  var self = this;
  if (self.isNew) {
    self._id = mongoose.Types.ObjectId();

    const files = await saveImage(self.id, self.files.default);

    self.files = files;
  }
});

mongoose.model('Image', ImageSchema);

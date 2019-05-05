const config = require('config');
const { join } = require('path');
const async = require('async');
const { remove } = require('fs-extra');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { saveImage } = require('../../lib/images');

/**
 * Config
 */

const imagesPath = join(__dirname, '..', '..', ...config.get('imagesPath'));

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

ImageSchema.pre('remove', async function (next) {
  // Remove files reference, by size. Should not raise error if file
  // doesn't exist.
  for (const size of ['thumb', 'mini', 'default', 'large']) {
    const filepath = join(imagesPath, this.files[size]);
    await remove(filepath);
  }

  next();
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

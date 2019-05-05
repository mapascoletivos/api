const messages = require('../../lib/messages');
const mongoose = require('mongoose');
const Image = mongoose.model('Image');

/**
 * Load image
 */

exports.load = function (req, res, next, id) {
  Image.load(id, function (err, image) {
    if (err) return next(err);
    if (!image) {
      return res.json(
        400,
        messages.error(req.i18n.t('image.load.error.not_found'))
      );
    }
    req.image = image;
    next();
  });
};

/**
 * Show image
 */

exports.show = function (req, res) {
  res.json(req.image);
};

exports.showForm = function (req, res) {
  res.send(
    '<html>' +
      '<body>' +
      '<form action="api/v1/images" method="post" enctype="multipart/form-data">' +
      '<input type="hidden" name="_csrf" value="' +
      req.csrfToken() +
      '"  />' +
      'Choose a file to upload <input type="file" name="attachment[file]" />' +
      '<input type="submit" value="upload" />' +
      '</form>' +
      '</body>' +
      '</html>'
  );
};

/**
 * Create image
 */

exports.create = async function (req, res) {
  try {
    if (!req.files.attachment.file) {
      return res.json(
        400,
        messages.error(req.i18n.t('image.create.error.not_found'))
      );
    } else {
      const image = new Image({
        creator: req.user,
        files: { default: req.files.attachment.file.path }
      });

      await image.save();

      return res.json(image.depopulate().toJSON());
    }
  } catch (error) {
    return res.json(400, messages.mongooseErrors(req.i18n.t, error, 'image'));
  }
};

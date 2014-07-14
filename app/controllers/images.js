
/**
 * Module dependencies.
 */

var 
	fs = require('fs'),
	_ = require('underscore'),
	messages = require('../../lib/messages'),
	Imager = require('imager'),
	imagerConfig = require('../../config/imager.js'),
	imager = new Imager(imagerConfig, 'Local'),
	mongoose = require('mongoose'), 
	Image = mongoose.model('Image');

/**
 * Load image
 */

exports.load = function (req, res, next, id) {
	Image.load(id, function (err, image) {
		if (err) return next(err)
		if (!image) return res.json(400, messages.error(req.i18n.t('image.load.error.not_found')));
		req.image = image
		next()
	});
}

/**
 * Show image
 */

exports.show = function (req, res) {
	res.json(req.image);
}

exports.showForm = function (req, res) {
	res.send('<html>' +
    '<body>' +
      '<form action="api/v1/images" method="post" enctype="multipart/form-data">' +
				'<input type="hidden" name="_csrf" value="'+req.csrfToken()+'"  />' +
        'Choose a file to upload <input type="file" name="attachment[file]" />' +
        '<input type="submit" value="upload" />' +
      '</form>' +
    '</body>' +
  '</html>')
}

/**
 * Create image
 */

exports.create = function (req, res) {

	if (!req.files.attachment.file) {
		return res.json(400, messages.error(req.i18n.t('image.create.error.not_found')));
	}
	else {
		
		var image = new Image({
			creator: req.user,
			sourcefile: req.files.attachment.file.path
		});

		image.save(function(err){
			if (err) return res.json(400, messages.mongooseErrors(req.i18n.t, err, 'image'));
			else return res.json(image);
		})

	}
}
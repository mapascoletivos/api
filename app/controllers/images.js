
/**
 * Module dependencies.
 */

var 
	fs = require('fs'),
	_ = require('underscore'),
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
		if (!image) return res.json(400, new Error('Image not found'));
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

	if (!req.files.attachment.file) return res.json(400, new Error('Image file not found'));
	
	imager.upload([req.files.attachment.file], function (err, cdnUri, uploaded) {

		if (err) return res.json(400, err);

		else {
		
			var image = new Image();
			console.log(uploaded);

			image.file.url = req.protocol + "://" + req.get('host') + '/uploads/images/large_'+ uploaded[uploaded.length-1];		
			
			image.save(function(err){
				if (err) return res.json(400, err);
				else  res.json(image);
			});

		}
	}, 'items');
	
}

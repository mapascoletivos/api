
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Imager = require('imager'),
	imagerConfig = require('../../config/imager.js'),
	imager = new Imager(imagerConfig, 'Local');

/**
 * Layer schema
 */

var ImageSchema = new Schema({
	creator: {type: Schema.ObjectId, ref: 'User'},
	uploadedAt: {type: Date, default: Date.now},
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

ImageSchema.pre('remove', function(next){
	var self = this;
	imager.remove([self.file.name], function(err){
		if ((!err) && (self.content)) {
			mongoose.model('Content').findById(self.content, function(err, ct){
				ct.removeImageAndSave(self._id, next);
			});
		}
		else 
			next(err);
	}, 'img');
});

ImageSchema.pre('save', function(next){
	var self = this;
	if (self.isNew) {
		imager.upload([self.files.default], function (err, cdnUri, uploaded) {
				if (err) return done(err);
				else {

					// save filesnames
					self.files.thumb = 'thumb_' + uploaded[uploaded.length-1];
					self.files.mini = 'mini_' + uploaded[uploaded.length-1];
					self.files.default = 'default_' + uploaded[uploaded.length-1];
					self.files.large = 'large_' + uploaded[uploaded.length-1];


					// This is a auxiliary attribute. It has to be declared at the model
					// because of mongoose but isn't needed after image upload.
					delete self.sourcefile;
					next();
				}
			}, 'items');			
	} else next();
});


mongoose.model('Image', ImageSchema);
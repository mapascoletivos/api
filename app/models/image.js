
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
	filename: String
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

/**
 * Methods
 */

ImageSchema.methods = {

	uploadImageAndSave: function(sourcefile, done){
		var 
			self = this;

		imager.upload([sourcefile], function (err, cdnUri, uploaded) {
			if (err) next(err);
			else {
				self.filename = uploaded[uploaded.length-1];
				self.save(done);
			}
		}, 'items');
	}
}



mongoose.model('Image', ImageSchema);
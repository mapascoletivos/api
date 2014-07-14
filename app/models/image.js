
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
	filename: String,
	sourcefile: String
});

/**
 * Virtuals
 */

ImageSchema.virtual('thumb').get(function () {
  return 'thumb_' + this.filename;
});
ImageSchema.virtual('mini').get(function () {
  return 'mini_' + this.filename;
});
ImageSchema.virtual('large').get(function () {
  return 'large_' + this.filename;
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
		imager.upload([self.sourcefile], function (err, cdnUri, uploaded) {
				if (err) return done(err);
				else {
					console.log(uploaded);
					self.filename = 'default_' + uploaded[uploaded.length-1];

					// This is a auxiliary attribute. It has to be declared at the model
					// because of mongoose but isn't needed after image upload.
					delete self.sourcefile;
					next();
				}
			}, 'items');			
	} else next();
});

/**
 * Methods
 */

// ImageSchema.methods = {

// 	uploadImageAndSave: function(sourcefile, done){
// 		var 
// 			self = this;

// 		imager.upload([sourcefile], function (err, cdnUri, uploaded) {
// 			if (err) 
// 				done(err);
// 			else {
// 				self.filename = uploaded[uploaded.length-1];
// 				self.save(done);
// 			}
// 		}, 'items');
// 	}
// }



mongoose.model('Image', ImageSchema);

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
	content: {type: Schema.ObjectId, ref: 'content'},
	uploadedAt: {type: Date, default: Date.now},
	file: {
		name: String,
		url: String
	}
});

/**
 * Hooks
 */

ImageSchema.pre('remove', function(next){
	var self = this;
	imager.remove(self.file.name, function(err){
		next(err);
	})
});

mongoose.model('Image', ImageSchema);
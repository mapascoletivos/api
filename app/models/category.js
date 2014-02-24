
/*!
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Category schema
 */

var CategorySchema = new Schema({
	title: { type: String, required: true },
	description: String,
	color: String,
	oldId: Number // used for old MC import
});


mongoose.model('Category', CategorySchema);

/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Layer schema
 */

var LayerSchema = new Schema({
	creator: {type: Schema.ObjectId, ref: 'User'},
	features: [{type: Schema.ObjectId, ref: 'Features'}],
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	tags: [String],
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	title: { type: String, required: true }
})


mongoose.model('Layer', LayerSchema)
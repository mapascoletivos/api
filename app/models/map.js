
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Map schema
 */

var MapSchema = new Schema({
	title: { type: String, required: true },
	description: String,
	creator: {type: Schema.ObjectId, ref: 'User'},
	layers: [{type: Schema.ObjectId, ref: 'Layer'}],
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now},
	maxZoom: Number,
	minZoom: Number,
	zoom: Number,
	center: [Number,Number], // [ lat , lon ]
	southWest: [Number,Number],
	northEast: [Number,Number],
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	layout:{ type: String, enum: ['Scroll', 'Timeline'], default: 'Scroll'},
	tags: [String],
	isDraft: {type: Boolean, default: true}
});


/**
 * Statics
 */

MapSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.exec(cb)
	},
	
	list: function (options, cb) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}	
	
}

mongoose.model('Map', MapSchema);
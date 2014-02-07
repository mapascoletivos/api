
/**
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	extend = require('mongoose-schema-extend'),
	Schema = mongoose.Schema;

/**
 * Layer schema
 */

var LayerSchema = new Schema({
	title: { type: String, required: true },
	description: String,
	creator: {type: Schema.ObjectId, ref: 'User'},
	features: [{type: Schema.ObjectId, ref: 'Feature'}],
	contents: [{type: Schema.ObjectId, ref: 'Content'}],
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	tags: [String],
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	isDraft: {type: Boolean, default: true},
	type: { type: String, enum: ['FeatureLayer', 'TileLayer'], default: 'FeatureLayer'},
	url: String
});

/**
 * Statics
 */

LayerSchema.statics = {

	/**
	 * Find layer by id
	 *
	 * @param {ObjectId} id
	 * @param {Function} cb
	 * @api private
	 */

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator')
			.populate('features')
			.populate('contents')
			.exec(cb)
	},
	
	/**
	 * List layers
	 *
	 * @param {Object} options
	 * @param {Function} cb
	 * @api private
	 */

	list: function (options, cb) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}	
	
}

mongoose.model('Layer', LayerSchema)
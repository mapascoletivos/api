
/*!
 * Module dependencies
 */

var 
	async = require('async'),
	_ = require('underscore'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Feature schema
 */

var FeatureSchema = new Schema({
	creator: { type: Schema.ObjectId, ref: 'User', required: true},
	layers: [{ type: Schema.ObjectId, ref: 'Layer'}],
	contents: [{ type: Schema.ObjectId, ref: 'Content'}],	
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	properties: {},
	title: { type: String, required: true },
	description: { type: String },
	geometry: { type: {type: String}, coordinates: []},
	version: { type: Number, default: 1},
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	source: {type: String, required: true, default: 'local'},
	tags: [String],
	oldId: Number
})

/**
 * Geo index
 **/

FeatureSchema.index({ loc: '2dsphere' })

/**
 * Methods
 */

FeatureSchema.methods = {
	addContentAndSave: function(content, done) {
		this.contents.addToSet(content) // = _.union(this.contents, [content]);
		this.save(done);
	},
	removeContentAndSave: function(content, done){
		var self = this;
		
		// transform newFeaturesArray to a array of ids, if not already
		if (typeof(content['_id']) != 'undefined') { 
			content = content._id;
		}

		self.contents.pull({ _id: content }); // _.without(self.contents, _.findWhere(self.contents, content));
		
		self.save(done);
	}
}

/**
 * Pre-save hooks
 */

FeatureSchema.pre('remove', function(next){
	var self = this;

	async.each( self.contents, 
		function(contentId, done){
			mongoose.model('Content').findById(contentId, function(err, content){
				content.removeFeatureAndSave(self, done);
			})
		}, next);
});

/**
 * Statics
 */

FeatureSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator', 'name username email')
			.populate('contents')
			.exec(cb)
	},
	
	list: function (options, cb) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.populate('creator', 'name username email')
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}	
	
}

mongoose.model('Feature', FeatureSchema)
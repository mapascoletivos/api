
/*!
 * Module dependencies
 */

var 
	_ = require('underscore'),
	async = require('async'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Layer schema
 */

var ContentSchema = new Schema({
	type: { type: String, enum: ['Markdown', 'Post', 'Video', 'Image Gallery'], required: true},
	title: { type: String, required: true },
	url: String,
	sirTrevorData: [],
	sirTrevor: String,
	markdown: String,	
	creator: {type: Schema.ObjectId, ref: 'User'},
	features: [{type: Schema.ObjectId, ref: 'Feature'}],
	layer: {type: Schema.ObjectId, ref: 'Layer', required: true},
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	tags: [String]
});

/**
 * Hooks
 */

ContentSchema.pre('remove', function(next){
	var self = this;

	// remove association from features
	async.each(self.features, function(featureId, done){
		mongoose.model('Feature').findById(featureId, function(err, feature){
			if (err) next(err)
			else {
				feature.contents.pull(self._id);
				feature.save(done);				
			}
		})
	}, next);

});

/**
 * Statics
 */

ContentSchema.statics = {

	/**
	 * Find Content by id
	 *
	 * @param {ObjectId} id
	 * @param {Function} cb
	 * @api private
	 */

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('layer')
			.populate('features')
			.exec(cb)
	},
	
	/**
	 * List Contents
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

/**
 * Methods
 */

ContentSchema.methods = {

	removeFeatureAndSave: function(feature, done){
		var 
			self = this;

		if (typeof(feature['_id']) != 'undefined') { feature = feature._id; }

		self.features = _.without(self.features, _.findWhere(self.features, feature));

		self.save(done);
	},
	
	setFeaturesAndSave: function(featureSet, done) {
		var 
			currentFeatures = this.features,
			self = this;

		async.each(this.features, function(ftId, cb){
			mongoose.model('Feature').findById(ftId, function(err,ft){
				ft.contents.pull(self._id);
				ft.save(cb);
			})
		}, 
		function(err){
			if (err) done(err);
			async.each(featureSet, function(newFtId, cb){
				mongoose.model('Feature').findById(newFtId, function(err, newFt){
					newFt.contents.addToSet(self._id);
					newFt.save(cb);
				})
			}, function(err){
				if (err) done(err);
				self.features = featureSet;
				self.save(done);
			});
		})


	}
}

mongoose.model('Content', ContentSchema)
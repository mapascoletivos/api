
/*!
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Area = mongoose.model('Area'),
	Content = mongoose.model('Content'),
	_ = require('underscore');

/**
 * Feature schema
 */

var FeatureSchema = new Schema({
	creator: { type: Schema.ObjectId, ref: 'User', required: true},
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	properties: {},
	title: { type: String, required: true },
	description: { type: String },
	geometry: { type: {type: String}, coordinates: []},
	address: [{type: Schema.ObjectId, ref: 'Area'}],
	version: { type: Number, default: 1},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now},
	source: {type: String, required: true, default: 'local'},
	tags: [String],
	oldId: Number
})

/**
 * Geo index
 **/

FeatureSchema.index({ loc: '2dsphere' })

/**
 * Pre and Post middleware
 */

FeatureSchema.pre('save', function(next){
	var self = this;

	if (self.isDirectModified('geometry')) {
	Area.whichContains(self.geometry, function(err, areas){
		if (err){
			console.log(err);

				// Address lookup shouldn't block feature save,
				// so next() is called without the error
				next();	
			} 
			else {
				delete self.address
				self.address = areas;
				next();
			}
	 	}) 		
 	} else {
 		next();
 	}
});

FeatureSchema.pre('remove', function(next){
	var self = this;
	
	Content
		.find({features: {$in: [self._id]}})
		.exec(function(err, contents){
			if (!err) {
				_.each(contents, function(content){
					content.features.pop(self._id);
					content.save(next);
				});
			} 
		});
	
});

/**
 * Virtuals
 **/

FeatureSchema.virtual('contents').get(function () {
  return this._contents;
}).set(function(contents) {
  this._contents;
});

/**
 * Statics
 */

FeatureSchema.statics = {

	load: function (id, cb) {
		var self = this;
		
		self.findOne({ _id : id })
			.populate('creator', 'name username email')
			.populate('address')
			.exec(cb);
	},
	
	list: function (options, doneList) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.populate('creator', 'name username email')
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(function(err, features){
			if (err) doneList(err);
			else {
				var populatedFeatures = []
				async.each(features, function(feature, callback){
					self.populateContents(feature, function(err, f){
						if (err) callback(err);
						else {
							populatedFeatures.push(f);
							callback();
						}
					})
				},function(err){
					if (err) doneList(err)
					else doneList(null, populatedFeatures);
				})
			}
		})
	}	
	
}

mongoose.model('Feature', FeatureSchema)
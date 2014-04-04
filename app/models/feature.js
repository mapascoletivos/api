
/*!
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	Area = mongoose.model('Area');

/**
 * Feature schema
 */

var FeatureSchema = new Schema({
	creator: { type: Schema.ObjectId, ref: 'User', required: true},
	contents: [{ type: Schema.ObjectId, ref: 'Content'}],	
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
})


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
 * Statics
 */

FeatureSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator', 'name username email')
			.populate('address')
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
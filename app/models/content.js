
/**
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
		title: { type: String, required: true },
		sections: [],
		creator: {type: Schema.ObjectId, ref: 'User'},
		features: [{type: Schema.ObjectId, ref: 'Feature'}],
		layer: {type: Schema.ObjectId, ref: 'Layer', required: true},
		createdAt: {type: Date, default: Date.now},
		updatedAt: {type: Date, default: Date.now},
		tags: [String]
	}, {
		toObject: { virtuals: true },
	    toJSON: { virtuals: true }	
	});

/*
 * Hooks
 */

ContentSchema.pre('save', function(next){
	var self = this;
	if (self.isNew) {

		function addImageFilesReferencesToSections(done){
			async.eachSeries(self.sections, function(section, doneEach){
				if (section.type == 'yby_image'){
					var id = section.data._id || section.data.id;
					mongoose.model('Image').findById(id, function(err, img){
						if (err) return next(err);
						section = {
							type: 'yby_image',
							data: {
								id: id,
								files: img.files
							}
						}
						doneEach();
					})

				} else doneEach();
			}, done)
		}

		function addToLayer(done){
			mongoose.model('Layer').findById(self.layer, function(err, layer){
				if (err) return next(err);
				else {
					layer.contents.addToSet(self);
					layer.save(done);
				}
			});

		}

		async.series([addImageFilesReferencesToSections, addToLayer], next);

	} else next();
});

ContentSchema.pre('remove', function(donePre){
	var self = this;

	async.eachSeries(self.sections, function(section, doneEach){
		if (section.type == 'yby_image'){
			var id = section.data._id || section.data.id;
			mongoose.model('Image').findById(id, function(err, img){
				if (err) donePre(err);
				else img.remove(doneEach);
			})
		} else doneEach();
	}, donePre);

});

/*
 * Validator
 */

ContentSchema.path('sections').validate(function (sections) {
	var errors = [];
	console.log(sections);
	if (sections.length > 0) {
		_.each(sections, function(section){
			if (!section.hasOwnProperty('type')) errors.push('missing type');
			if (!section.hasOwnProperty('data')) errors.push('missing data');
			switch (section.type) {
				case 'yby_image':
					if (!section.data.hasOwnProperty('_id')) errors.push('missing id');
					break;
				case 'text':
					if (!section.data.hasOwnProperty('text')) errors.push('text');
					break;
				case 'list':
					if (!section.data.hasOwnProperty('text')) errors.push('text');
					break;
				case 'video':
					if (!section.data.hasOwnProperty('source')) errors.push('source');
					if (!section.data.hasOwnProperty('remote_id')) errors.push('remote_id');
					break;
			}
		});
	}
	return (errors.length == 0);
}, 'malformed_sections');

/**
 * Methods
 */

ContentSchema.methods = {

	updateSirTrevor: function(sirTrevorData, done){
		var 
			self = this,
			imagesToRemove,
			imagesToAdd;
					
		function getRemovedImages(sirTrevorData){
			var removedImages = [];
			_.each(self.sirTrevorData, function(item){
				if (!item._id)
					item._id = item.data._id;
				if ((item.type == 'image') && !_.contains(sirTrevorData, item)) {
					removedImages.push(item);
				}
			})
			return removedImages;
		}

		function getAddedImages(sirTrevorData){
			var addedImages = [];
			_.each(sirTrevorData, function(item){
				if (!item._id)
					item._id = item.data._id;
				if ((item.type == 'image') && !_.contains(self.sirTrevorData, item._id)) {
					addedImages.push(item);
				}
			})
			return addedImages;
		}
		
		imagesToRemove = getRemovedImages(sirTrevorData);
		imagesToAdd = getAddedImages(sirTrevorData);
		
		
		async.parallel([
			function(callback){
				if (!imagesToRemove) 
					callback();
				else
					async.each(imagesToRemove, function(item, cb){
						mongoose.model('Image').findById(item.data._id).remove(cb)
					}, callback);
			},
			function(callback){
				if (!imagesToAdd) 
					callback();
				else
					async.each(imagesToAdd, function(item, cb){
						mongoose.model('Image').findById(item.data._id, function(err, img){
							if (err) {
								cb(err);
							}
							else {
								// set reference to this content
								img.content = self;
								img.save(cb);
							}
						});
				}, callback)
			}
		], function(err){
			self.sirTrevorData = sirTrevorData;
			done(err, self);
		});
	},

	removeImageAndSave: function(imageId, done) {

		var self = this;

		async.each(self.sirTrevorData, function(item, done){
			// if image exists in sirTrevor, remove it
			if ((item.type == 'image') && (item.data._id.toHexString() == imageId.toHexString())) {
				self.sirTrevorData.pull(item);
			}
			done();			
		}, function(err){
			if (err) done(err);
			else self.save(done);
		});
	}
}

/**
 * Statics
 */

ContentSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator', 'name username email')
			.populate('layer')
			.populate('features')
			.populate('sirTrevorData')
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

mongoose.model('Content', ContentSchema)
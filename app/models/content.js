/**
 * Module dependencies
 */

var _ = require('underscore');

var async = require('async');

var mongoose = require('mongoose');

var Schema = mongoose.Schema;
/**
 * Layer schema
 */

var ContentSchema = new Schema({
  title: { type: String, required: true },
  sections: [],
  creator: { type: Schema.ObjectId, ref: 'User' },
  features: [{ type: Schema.ObjectId, ref: 'Feature' }],
  layer: { type: Schema.ObjectId, ref: 'Layer', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  tags: [String]
});

/*
 * Hooks
 */

ContentSchema.pre('save', function (next) {
  var self = this;

  var Image = mongoose.model('Image');

  function addImageFilesReferencesToSections (done) {
    var i = 0;
    async.eachSeries(
      self.sections,
      function (section, doneEach) {
        i++;
        if (section.type === 'yby_image') {
          var id = section.data._id || section.data.id;
          Image.findById(id)
            .lean()
            .exec(function (err, img) {
              if (err) return doneEach(err);
              if (!img) return doneEach(new Error('image not found'));
              self.sections[i - 1]['data'] = img;
              doneEach();
            });
        } else doneEach();
      },
      function (err, results) {
        if (err) return next(err);
        done();
      }
    );
  }

  function addToLayer (done) {
    mongoose.model('Layer').findById(self.layer, function (err, layer) {
      if (err) return next(err);
      else {
        layer.contents.addToSet(self);
        layer.save(done);
      }
    });
  }

  if (self.isNew) {
    async.series([addImageFilesReferencesToSections, addToLayer], next);

    // } else next();
  } else {
    addImageFilesReferencesToSections(function (err) {
      next(err);
    });
  }
});

ContentSchema.pre('remove', function (donePre) {
  var self = this;

  async.eachSeries(
    self.sections,
    function (section, doneEach) {
      if (section.type === 'yby_image') {
        var id = section.data._id || section.data.id;
        mongoose.model('Image').findById(id, function (err, img) {
          if (err) donePre(err);
          else img.remove(doneEach);
        });
      } else doneEach();
    },
    donePre
  );
});

/*
 * Validator
 */

ContentSchema.path('sections').validate(function (sections) {
  var errors = [];
  if (sections.length > 0) {
    _.each(sections, function (section) {
      if (!section.hasOwnProperty('type')) errors.push('missing type');
      if (!section.hasOwnProperty('data')) errors.push('missing data');
      switch (section.type) {
        case 'yby_image':
          if (
            !section.data.hasOwnProperty('_id') &&
            !section.data.hasOwnProperty('id')
          ) {
            errors.push('missing id');
          }
          break;
        case 'text':
          if (!section.data.hasOwnProperty('text')) errors.push('text');
          break;
        case 'list':
          if (!section.data.hasOwnProperty('text')) errors.push('text');
          break;
        case 'video':
          if (!section.data.hasOwnProperty('source')) errors.push('source');
          if (!section.data.hasOwnProperty('remote_id')) {
            errors.push('remote_id');
          }
          break;
      }
    });
  }
  return errors.length === 0;
}, 'malformed_sections');

/**
 * Statics
 */

ContentSchema.statics = {
  load: function (id, cb) {
    this.findOne({ _id: id })
      .populate('creator', 'name username email')
      .populate('layer')
      .populate('features')
      .exec(cb);
  },

  list: function (options, cb) {
    var criteria = options.criteria || {};

    this.find(criteria)
      .populate('creator', 'name username email')
      .sort({ createdAt: -1 }) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb);
  }
};

mongoose.model('Content', ContentSchema);

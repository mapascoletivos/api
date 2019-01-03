/*!
 * Module dependencies
 */

var async = require('async');

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var Content = mongoose.model('Content');

/**
 * Feature schema
 */

var FeatureSchema = new Schema({
  creator: { type: Schema.ObjectId, ref: 'User', required: true },
  visibility: {
    type: String,
    enum: ['Public', 'Visible', 'Private'],
    default: 'Private'
  },
  properties: {},
  title: { type: String, required: true },
  description: { type: String },
  geometry: { type: { type: String }, coordinates: [] },
  address: [{ type: Schema.ObjectId, ref: 'Area' }],
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  source: { type: String, required: true, default: 'local' },
  tags: [String],
  oldId: Number
});

/**
 * Geo index
 **/

FeatureSchema.index({ loc: '2dsphere' });

/**
 * Pre and Post middleware
 */

FeatureSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Before deleting ifself, all association to contents should be removed
FeatureSchema.pre('remove', function (next) {
  var self = this;

  Content.find({ features: { $in: [self._id] } }).exec(function (err, contents) {
    if (!err) {
      async.each(
        contents,
        function (content) {
          content.features.pop(self._id);
          content.save(next);
        },
        next
      );
    } else next(err);
  });
});

/**
 * Virtuals
 **/

FeatureSchema.virtual('contents')
  .get(function () {
    return this._contents;
  });

/**
 * Statics
 */

FeatureSchema.statics = {
  load: function (id, cb) {
    var self = this;

    self
      .findOne({ _id: id })
      .populate('creator', 'name username email')
      .populate('address')
      .exec(cb);
  },

  list: function (options, doneList) {
    var self = this;
    var criteria = options.criteria || {};

    this.find(criteria)
      .populate('creator', 'name username email')
      .sort({ createdAt: -1 }) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(function (err, features) {
        if (err) doneList(err);
        else {
          var populatedFeatures = [];
          async.each(
            features,
            function (feature, callback) {
              self.populateContents(feature, function (err, f) {
                if (err) callback(err);
                else {
                  populatedFeatures.push(f);
                  callback();
                }
              });
            },
            function (err) {
              if (err) doneList(err);
              else doneList(null, populatedFeatures);
            }
          );
        }
      });
  }
};

mongoose.model('Feature', FeatureSchema);

/**
 * Module dependencies
 */

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var async = require('async');

/**
 * Layer schema
 */

var LayerSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    creator: { type: Schema.ObjectId, ref: 'User' },
    maps: [{ type: Schema.ObjectId, ref: 'Map' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    visibility: {
      type: String,
      enum: ['Public', 'Visible', 'Private'],
      default: 'Private'
    },
    type: {
      type: String,
      enum: ['FeatureLayer', 'TileLayer'],
      default: 'FeatureLayer'
    },

    // Content Layer Attributes
    contributors: [{ type: Schema.ObjectId, ref: 'User' }],
    features: [{ type: Schema.ObjectId, ref: 'Feature' }],
    styles: {},
    contents: [{ type: Schema.ObjectId, ref: 'Content' }],
    isDraft: { type: Boolean, default: true },
    oldId: Number,

    // Tile Layer Attributes
    url: String,
    properties: {}
  },
  {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

/**
 * Hooks
 */

LayerSchema.pre('remove', function (next) {
  var self = this;

  var removeFeatures = function (callback) {
    async.eachSeries(
      self.features,
      function (feature, doneRemoveFeature) {
        feature.remove(doneRemoveFeature);
      },
      callback
    );
  };

  var removeContents = function (callback) {
    async.eachSeries(
      self.contents,
      function (content, doneRemoveContent) {
        content.remove(doneRemoveContent);
      },
      callback
    );
  };

  var removeFromMaps = function (callback) {
    async.eachSeries(
      self.maps,
      function (mapId, doneDessociateFromMap) {
        mongoose.model('Map').findById(mapId, function (err, map) {
          if (err) callback(err);
          map.removeLayerAndSave(self, doneDessociateFromMap);
        });
      },
      callback
    );
  };

  async.series([removeFeatures, removeContents, removeFromMaps], next);
});

/**
 * Methods
 */

LayerSchema.methods = {
  removeMapAndSave: function (map, done) {
    var self = this;

    self.maps.pull({ _id: map._id });

    self.save(done);
  }
};

/**
 * Statics
 */

LayerSchema.statics = {
  load: function (id, doneLoading) {
    this.findOne({ _id: id })
      .populate('creator', 'name username email')
      .populate('contributors', 'name username email')
      .populate('features')
      .populate('contents')
      .exec(function (err, layer) {
        if (err || !layer) {
          doneLoading(err, null);
        } else {
          var populateFeatures = function (features, donePopulateFeatures) {
            var populatedFeatures = [];
            async.each(
              features,
              function (feature, cb) {
                feature.populate('creator', 'name username email', function (
                  err,
                  ft
                ) {
                  feature = ft;
                  if (err) cb(err);
                  else {
                    feature.populate('address', function (err, ft) {
                      feature = ft;
                      if (err) cb(err);
                      else {
                        populatedFeatures.push(feature);
                        cb();
                      }
                    });
                  }
                });
              },
              function (err) {
                donePopulateFeatures(err, populatedFeatures);
              }
            );
          };

          var populateContentsCreator = function (
            contents,
            donePopulateContents
          ) {
            var populatedContents = [];
            async.each(
              contents,
              function (content, cb) {
                content.populate('creator', 'name username email', function (
                  err,
                  ctt
                ) {
                  if (err) cb(err);
                  else {
                    populatedContents.push(ctt);
                    cb();
                  }
                });
              },
              function (err) {
                donePopulateContents(err, populatedContents);
              }
            );
          };

          async.parallel(
            [
              function (cb) {
                populateFeatures(layer.features, function (err, features) {
                  cb(err);
                });
              },
              function (cb) {
                populateContentsCreator(layer.contents, function (
                  err,
                  contents
                ) {
                  layer.contents = contents;
                  cb(err);
                });
              }
            ],
            function (err) {
              doneLoading(err, layer);
            }
          );
        }
      });
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

mongoose.model('Layer', LayerSchema);

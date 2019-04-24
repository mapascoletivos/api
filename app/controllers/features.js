/**
 * Module dependencies.
 */

var _ = require('underscore');

var mongoose = require('mongoose');

var Feature = mongoose.model('Feature');

var Content = mongoose.model('Content');

var messages = require('../../lib/messages');

var async = require('async');

/**
 * Load
 */

exports.load = function (req, res, next, id) {
  Feature.load(id, function (err, feature) {
    if (err) {
      return next(err);
    } else if (!feature) {
      return res.json(
        400,
        messages.error(req.i18n.t('feature.load.error.cant_find'))
      );
    } else {
      req.feature = feature;
      next();
    }
  });
};

/**
 * List
 */

exports.index = function (req, res) {
  const options = {
    perPage: req.perPage,
    page: req.page
  };

  Feature.list(options, function (err, features) {
    if (err) {
      return res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
    }
    Feature.count().exec(function (err, count) {
      if (!err) {
        res.json({
          options: options,
          featuresTotal: count,
          features: features
        });
      } else {
        res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
      }
    });
  });
};

/**
 * Create a feature
 */

exports.create = function (req, res) {
  var feature = new Feature(req.body);
  feature.creator = req.user;
  feature.layer = req.layer;

  feature.markModified('geometry');

  // save feature
  feature.save(function (err) {
    if (err) {
      res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
    } else {
      var layer = feature.layer;
      layer.features.addToSet(feature);

      // save layer
      layer.save(function (err) {
        if (err) {
          res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
        }
        res.json(feature);
      });
    }
  });
};

/**
 * Show
 */

exports.show = function (req, res) {
  var feature = req.feature.toObject();

  // This step is needed to populate features with related contents
  // as they are not part of feature model.
  Content.find({ features: { $in: [feature._id] } }).exec(function (
    err,
    contents
  ) {
    if (err) res.json(400, err.message);
    else {
      if (contents) {
        feature.contents = _.map(contents, function (ct) {
          return ct._id;
        });
      } else feature.contents = [];

      res.json(feature);
    }
  });
};

/**
 * Update feature
 */

exports.update = function (req, res) {
  var feature = req.feature;

  // Association to contents should be handled at Content Model.
  delete req.body['contents'];
  delete req.body['address'];

  // If geometry hasn't changed, don't update it at the model to
  // avoid address lookup
  if (_.isEqual(feature.geometry.coordinates, req.body.geometry.coordinates)) {
    delete req.body.geometry;
  }

  feature = _.extend(feature, req.body);

  feature.save(function (err) {
    if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
    else res.json(feature);
  });
};

/**
 * Add content to feature
 */

exports.addContent = function (req, res) {
  var feature = req.feature;

  var content = req.content;

  // associate content to feature, if not already
  if (!_.contains(feature.contents, content._id)) {
    feature.contents.push(content);
  }

  // associate feature to content, if not already
  if (!_.contains(content.features, feature._id)) {
    content.features.push(feature);
  }

  // save both
  content.save(function (err) {
    if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'content'));
    feature.save(function (err) {
      if (err) {
        res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
      } else {
        res.json(messages.success(req.i18n.t('feature.add_content.success')));
      }
    });
  });
};

/**
 * Remove content from feature
 */

exports.removeContent = function (req, res) {
  var feature = req.feature;

  var content = req.content;

  feature.contents = _.filter(feature.contents, function (c) {
    return !c._id.equals(content._id);
  });

  content.features = _.filter(content.features, function (f) {
    return !f._id.equals(feature._id);
  });

  // save both
  content.save(function (err) {
    if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'content'));
    feature.save(function (err) {
      if (err) {
        res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
      } else {
        res.json(
          messages.success(req.i18n.t('feature.remove_content.success'))
        );
      }
    });
  });
};

/*
 * Import
 * (Batch create features)
 */

exports.import = function (req, res) {
  if (req.app.locals.settings.general.allowImports) {
    var layer = req.layer;
    async.eachSeries(
      req.body,
      function (feature, cb) {
        feature = new Feature(feature);
        feature.creator = req.user;
        feature.layer = req.layer;

        // Set geometry as modified, otherwise it won't do address lookup
        feature.markModified('geometry');

        // save feature
        feature.save(function (err) {
          if (err) {
            cb(err);
          } else {
            layer.features.addToSet(feature);

            // Wait 0.2 seconds to process next feature to avoid nominatim overload
            setTimeout(cb, 200);
          }
        });
      },
      function (err) {
        if (err) {
          res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
        } else {
          // save layer
          layer.save(function (err) {
            if (err) {
              if (err) {
                res.json(
                  400,
                  messages.mongooseErrors(req.i18n.t, err, 'layer')
                );
              }
            } else {
              res.json(layer.features);
            }
          });
        }
      }
    );
  } else {
    res.json(messages.error(req.i18n.t('feature.import.error.disabled')));
  }
};

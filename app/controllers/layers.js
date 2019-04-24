const messages = require('../../lib/messages');
const { isInt } = require('../../lib/utils');
const mongoose = require('mongoose');
const Layer = mongoose.model('Layer');
const Content = mongoose.model('Content');
const User = mongoose.model('User');
const _ = require('underscore');
const async = require('async');

/**
 * Load
 */
exports.load = function (req, res, next, id) {
  Layer.load(id, function (err, layer) {
    if (err) {
      return res.json(400, messages.error(req.i18n.t('layer.load.error')));
    } else if (!layer) {
      return res.json(400, messages.error(req.i18n.t('layer.load.not_found')));
    } else {
      req.layer = layer;
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
    page: req.page,
    criteria: { visibility: 'Visible' }
  };

  if (req.isAuthenticated() && req.user.role === 'admin') {
    delete options.criteria;
  }

  // get visible layers for a user
  if (req.param('userId')) {
    options.criteria = {
      $and: [{ creator: req.param('userId') }, { visibility: 'Visible' }]
    };
  }

  if (req.param('search')) {
    options.criteria = {
      $and: [
        options.criteria,
        { title: { $regex: req.param('search'), $options: 'i' } }
      ]
    };
  }

  Layer.list(options, function (err, layers) {
    if (err) {
      return res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
    }
    Layer.count(options.criteria).exec(function (err, count) {
      if (!err) {
        res.json({ options: options, layersTotal: count, layers: layers });
      } else {
        res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
      }
    });
  });
};

/**
 * Show
 */

exports.show = function (req, res) {
  var layer = req.layer.toObject();

  var features = [];

  // This step is needed to populate features with related contents
  // as they are not part of feature model.
  async.each(
    layer.features,
    function (feature, callback) {
      Content.find({ features: { $in: [feature._id] } })
        .select('_id')
        .exec(function (err, contents) {
          if (err) callback(err);
          else {
            if (contents) {
              feature.contents = _.map(contents, function (ct) {
                return ct._id;
              });
            } else feature.contents = [];
            features.push(feature);
            callback();
          }
        });
    },
    function (err) {
      if (err) res.json(400, messages.error(req.i18n.t('layer.show.error')));
      layer.features = features;
      res.json(layer);
    }
  );
};

/**
 * Create a layer
 */

exports.create = function (req, res) {
  var layer = new Layer();

  var type = req.body.type;

  if (!type) {
    return res.json(400, messages.error(req.i18n.t('layer.create.missing')));
  } else if (type === 'TileLayer') {
    layer.url = req.body.url;
    layer.properties = req.body.properties;
  } else if (type === 'FeatureLayer') {
    layer.features = req.body.features;
    layer.contents = req.body.contents;

    if (req.body.isDraft === false) layer.isDraft = req.body.isDraft;
  }

  layer.type = type;
  layer.title = req.body.title;
  layer.description = req.body.description;
  layer.creator = req.user;
  layer.maps = req.body.maps;
  layer.visibility = req.body.visibility;

  layer.save(function (err) {
    if (!err) {
      res.json({
        layer: layer,
        messages: messages.success(req.i18n.t('layer.create.success')).messages
      });
    } else {
      res.json(400, { messages: messages.mongooseError(req.i18n, err) });
    }
  });
};

/**
 * Update layer
 */

exports.update = function (req, res) {
  var layer = req.layer;

  // do not update features or contents at this route
  delete req.body['features'];
  delete req.body['contents'];
  delete req.body['__v'];

  if (req.layer === 'TileLayer') {
    return res.json(
      400,
      messages.error(req.i18n.t('layer.update.tilelayer.error'))
    );
  }

  layer = _.extend(layer, req.body);

  layer.save(function (err) {
    if (!err) {
      res.json({
        layer: layer,
        messages: messages.success(req.i18n.t('layer.update.success')).messages
      });
    } else res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
  });
};

/**
 * Delete layer
 */

exports.destroy = function (req, res) {
  var layer = req.layer;
  layer.remove(function (err) {
    if (err) {
      res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
    } else {
      res.json(messages.success(req.i18n.t('layer.destroy.success')));
    }
  });
};

/**
 * Add a feature in layer
 */

exports.addFeature = function (req, res) {
  var feature = req.feature;

  var layer = req.layer;

  // associate layer to feature, if not already
  if (!_.contains(layer.features, feature._id)) {
    layer.features.push(feature);
  }

  feature.save(function (err) {
    res.json(400, messages.mongooseErrors(req.i18n.t, err, 'feature'));
    layer.save(function (err) {
      if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
      else res.json(feature);
    });
  });
};

/**
 * Remove feature from layer
 */

exports.removeFeature = function (req, res) {
  var feature = req.feature;

  var layer = req.layer;

  var saveLayer = function (err) {
    if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
    layer.features = _.filter(layer.features, function (f) {
      return !f._id.equals(feature._id);
    });
    layer.save(function (err) {
      if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
      else res.json(feature);
    });
  };

  feature.remove(saveLayer);
};

/**
 * Add a contributor to layer
 */

exports.addContributor = function (req, res) {
  var contributorEmail = req.body.email;

  var layer = req.layer;

  if (contributorEmail === req.user.email) {
    res.json(
      400,
      messages.error(req.i18n.t('layer.contributor.add.error.already_exists'))
    );
  } else {
    User.findOne({ email: contributorEmail }, function (err, user) {
      if (err) {
        res.json(400, messages.mongooseErrors(req.i18n.t, err, 'user'));
      } else if (!user) {
        res.json(
          400,
          messages.error(req.i18n.t('layer.contributor.add.error.dont_exists'))
        );
      } else {
        layer.contributors.addToSet(user);
        layer.save(function (err) {
          if (err) {
            res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
          } else {
            Layer.findById(layer._id)
              .populate('contributors', 'name username email')
              .exec(function (err, updatedLayer) {
                if (err) {
                  res.json(
                    400,
                    messages.mongooseErrors(req.i18n.t, err, 'layer')
                  );
                }

                var data = {
                  layer: updatedLayer,
                  creator: req.user,
                  contributor: user
                };

                req.app.locals.mailer.sendEmail(
                  'inform_contributor_permission',
                  user.email,
                  data,
                  req.i18n,
                  function (err) {
                    if (err) {
                      res.json(
                        400,
                        messages.error(
                          req.i18n.t('layer.contributor.add.error.email')
                        )
                      );
                    } else {
                      res.json({
                        layer: updatedLayer,
                        messages: messages.success(
                          req.i18n.t('layer.contributor.add.success')
                        ).messages
                      });
                    }
                  }
                );
              });
          }
        });
      }
    });
  }
};

/**
 * Remove feature from layer
 */

exports.removeContributor = function (req, res) {
  var contributorId = req.query.contributorId;

  var layer = req.layer;

  let contributorCount = layer.contributors.length;

  layer.contributors.pull({ _id: contributorId });

  if (contributorCount === layer.contributors.lentgh) {
    res.json(
      400,
      messages.error(req.i18n.t('layer.contributor.remove.error.invalid_id'))
    );
  } else {
    layer.save(function (err) {
      if (err) {
        res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer'));
      } else {
        Layer.findById(layer._id)
          .populate('contributors', 'name username email')
          .exec(function (err, updatedLayer) {
            if (err) { res.json(400, messages.mongooseErrors(req.i18n.t, err, 'layer')); }

            res.json({
              layer: updatedLayer,
              messages: messages.success(
                req.i18n.t('layer.contributor.remove.success')
              ).messages
            });
          });
      }
    });
  }
};

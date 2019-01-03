/**
 * Module dependencies.
 */

var async = require('async');

var messages = require('../../lib/messages');

var mongoose = require('mongoose');

var Content = mongoose.model('Content');

var _ = require('underscore');

/**
 * Load
 */

exports.load = function (req, res, next, id) {
  Content.load(id, function (err, content) {
    if (err) {
      return next(err);
    } else if (!content) {
      return res.json(
        400,
        messages.error(req.i18n.t('content.load.error.not_found'))
      );
    } else {
      req.content = content;
      next();
    }
  });
};

/**
 * List
 */

exports.index = function (req, res) {
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
  var perPage = req.param('perPage') > 0 ? req.param('perPage') : 30;
  var options = {
    perPage: perPage,
    page: page
  };

  if (req.param('userId')) {
    options.criteria = { creator: req.param('userId') };
  }

  if (req.param('search')) {
    options.criteria = {
      $and: [
        options.criteria,
        { title: { $regex: req.param('search'), $options: 'i' } }
      ]
    };
  }

  Content.list(options, function (err, contents) {
    if (err) {
      return res.json(400, messages.mongooseErrors(req.i18n.t, err, 'content'));
    }
    Content.count(options.criteria).exec(function (err, count) {
      if (err) {
        res.json(400, messages.mongooseErrors(req.i18n.t, err, 'content'));
      } else {
        res.json({
          options: options,
          contentsTotal: count,
          contents: contents
        });
      }
    });
  });
};

/**
 * Create a content
 */

exports.create = function (req, res) {
  // clear creator field to avoid faking
  delete req.body['creator'];

  var content = new Content(req.body);

  // associate content to user originating request
  content.creator = req.user;

  content.save(function (err) {
    if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'content'));
    else res.json(content);
  });
};

/**
 * Update content
 */

exports.update = function (req, res) {
  var content = req.content;

  var currentImagesList = [];

  var newImagesList = [];

  delete req.body['__v'];
  delete req.body['creator'];
  delete req.body['layer'];

  // get the list of images that content has
  if (content.sections) {
    _.each(content.sections, function (section) {
      if (section.type === 'yby_image') {
        currentImagesList.push(
          (section.data.id || section.data._id).toString()
        );
      }
    });
  }

  // get the list of images being put
  if (req.body.sections) {
    _.each(req.body.sections, function (section) {
      if (section.type === 'yby_image') {
        newImagesList.push((section.data.id || section.data._id).toString());
      }
    });
  }

  var deletedImages = _.reject(currentImagesList, function (image) {
    return _.contains(newImagesList, image);
  });

  function removeImages (doneRemoveImages) {
    async.each(
      deletedImages,
      function (imageId, doneEach) {
        mongoose.model('Image').findById(imageId, function (err, img) {
          if (err) return doneEach(err);
          else img.remove(doneEach);
        });
      },
      doneRemoveImages
    );
  }

  content = _.extend(content, req.body);

  removeImages(function (err) {
    if (err) {
      // res.json(400, messages.error(req.i18n.t('content.update.error.image')));
      res.json(400, err.message);
    } else {
      content.save(function (err) {
        if (err) {
          res.json(400, messages.mongooseErrors(req.i18n.t, err, 'content'));
        } else res.json(content);
      });
    }
  });
};

/**
 * Show
 */

exports.show = function (req, res) {
  return res.json(req.content);
};

/**
 * Destroy content
 */

exports.destroy = function (req, res) {
  req.content.remove(function (err) {
    if (err) res.json(400, messages.mongooseErrors(req.i18n.t, err, 'content'));
    else res.json(messages.success(req.i18n.t('content.destroy.success')));
  });
};

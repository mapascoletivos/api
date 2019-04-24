/**
 * Module dependencies.
 */

const utils = require('../../lib/utils');
const validator = require('validator');
const messages = require('../../lib/messages');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Layer = mongoose.model('Layer');
const Map = mongoose.model('Map');

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
  var query = { username: id };
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    // change query if id string matches object ID regex
    query = { _id: id };
  }
  User.load(query, function (err, user) {
    if (err) return next(err);
    if (!user) return next(new Error(req.i18n.t('user.load.error') + id));
    req.profile = user;
    next();
  });
};

/**
 * Create user
 */

exports.create = function (req, res) {
  var user = new User(req.body);
  var preValidationErrors = [];

  function saveUser () {
    user.save(function (err) {
      if (err) {
        return res.json(400, messages.mongooseErrors(req.i18n.t, err, 'user'));
      } else {
        return res.json(
          messages.success(req.i18n.t('user.create.email.success'))
        );
      }
    });
  }

  // Checks existence of all fields before sending to mongoose

  if (!user.name) {
    preValidationErrors.push(req.i18n.t('user.create.error.missing_name'));
  }
  if (!user.email) {
    preValidationErrors.push(req.i18n.t('user.create.error.email.missing'));
  } else if (!validator.isEmail(user.email)) {
    preValidationErrors.push(req.i18n.t('user.create.error.email.invalid'));
  }

  if (!user.password) {
    preValidationErrors.push(req.i18n.t('user.create.error.password.missing'));
  } else if (user.password.length < 6) {
    preValidationErrors.push(req.i18n.t('user.create.error.password.length'));
  }

  if (preValidationErrors.length > 0) {
    return res.json(400, {
      messages: messages.errorsArray(req.i18n, preValidationErrors)
    });
  } else {
    // Send e-mail confirmation if needed
    if (req.app.locals.settings.mailer.enforceEmailConfirmation) {
      var data = {
        user: user,
        callbackUrl: req.app.locals.settings.general.clientUrl + '/login'
      };

      req.app.locals.mailer.sendEmail(
        'confirm_email',
        user.email,
        data,
        req.i18n,
        function (err) {
          if (err) {
            return res.json(
              400,
              messages.error(req.i18n.t('user.create.email.error.mailer'))
            );
          } else saveUser();
        }
      );
    } else {
      saveUser();
    }
  }
};

/**
 * Update user
 */

exports.update = function (req, res) {
  User.findById(req.user._id, function (err, user) {
    if (err) {
      return res.json(400, messages.error(req.i18n.t('user.update.error')));
    }

    // User is changing password
    if (req.body.userPwd) {
      if (!user.authenticate(req.body.userPwd)) {
        return res.json(
          400,
          messages.error(req.i18n.t('user.update.password.error.wrong'))
        );
      } else if (req.body.newPwd.length < 6) {
        return res.json(
          400,
          messages.error(req.i18n.t('user.update.password.error.length'))
        );
      } else {
        if (req.body.newPwd === req.body.validatePwd) {
          user.password = req.body.newPwd;
          user.save(function (err) {
            if (err) res.json(400, messages.errors(err));
            else {
              res.json(
                messages.success(req.i18n.t('user.update.password.success'))
              );
            }
          });
        } else {
          return res.json(
            400,
            messages.error(req.i18n.t('user.update.password.error.dont_match'))
          );
        }
      }

      // User is changing e-mail
    } else if (req.body.email) {
      // Check if is a diffent e-mail
      if (req.body.email === user.email) {
        return res.json(
          400,
          messages.error(
            req.i18n.t('user.update.email.error.already_associated')
          )
        );
      }

      // Check if is valid
      if (!validator.isEmail(req.body.email)) {
        return res.json(
          400,
          messages.error(req.i18n.t('user.update.email.error.invalid'))
        );
      }

      // Send confirmation, if e-mail is not already used
      User.findOne({ email: req.body.email }, function (err, anotherUser) {
        if (err || !req.body.callback_url) {
          return res.json(
            400,
            messages.error(
              req.i18n.t('user.update.email.error.missing_callback')
            )
          );
        } else if (!anotherUser) {
          var data = {
            user: user,
            newEmail: req.body.email,
            callbackUrl: req.body.callback_url
          };

          req.app.locals.mailer.sendEmail(
            'email_change',
            req.body.email,
            data,
            req.i18n,
            function (err) {
              if (err) {
                return res.json(
                  400,
                  messages.error(req.i18n.t('user.update.email.error.mailer'))
                );
              } else {
                return res.json(
                  messages.success(req.i18n.t('user.update.email.success'))
                );
              }
            }
          );
        } else {
          return res.json(
            400,
            messages.error(req.i18n.t('user.update.email.error.already_used'))
          );
        }
      });
    } else {
      user.bio = req.body.bio;
      user.name = req.body.name;
      user.username = req.body.username;
      user.save(function (err) {
        if (err) {
          res.json(400, messages.mongooseErrors(req.i18n.t, err, 'user'));
        } else res.json(messages.success(req.i18n.t('user.update.success')));
      });
    }
  });
};

/**
 * Show a user profile
 */

exports.show = function (req, res) {
  res.json(req.profile);
};

exports.info = function (req, res, next) {
  return res.json(req.user.info());
};

exports.layers = function (req, res, next) {
  const options = {
    perPage: req.perPage,
    page: req.page,
    criteria: {
      $or: [{ creator: req.user }, { contributors: { $in: [req.user._id] } }]
    }
  };

  if (req.param('search')) {
    options.criteria = {
      $and: [
        options.criteria,
        { title: { $regex: req.param('search'), $options: 'i' } }
      ]
    };
  }

  Layer.list(options, function (err, layers) {
    if (err) return res.json(400, err);
    Layer.count(options.criteria).exec(function (err, count) {
      if (!err) {
        res.json({ options: options, layersTotal: count, layers: layers });
      } else {
        res.json(400, utils.errorMessages(err.errors || err));
      }
    });
  });
};

exports.maps = function (req, res, next) {
  const options = {
    perPage: req.perPage,
    page: req.page,
    criteria: { creator: req.user }
  };

  if (req.param('search')) {
    options.criteria = {
      $and: [
        options.criteria,
        { title: { $regex: req.param('search'), $options: 'i' } }
      ]
    };
  }

  Map.list(options, function (err, maps) {
    if (err) return res.json(400, utils.errorMessages(err.errors || err));
    Map.count(options.criteria).exec(function (err, count) {
      if (err) res.json(400, utils.errorMessages(err.errors || err));
      else res.json({ options: options, mapsTotal: count, maps: maps });
    });
  });
};

/**
 * Send reset password token
 */

exports.resetPasswordToken = function (req, res) {
  User.findOne(
    {
      $or: [
        { email: req.body['emailOrUsername'] },
        { username: req.body['emailOrUsername'] }
      ]
    },
    function (err, user) {
      if (err) {
        res.render('users/forgot_password', {
          title: req.i18n.t('user.reset_pwd.mail.title'),
          message: req.flash('error')
        });
      } else {
        if (user) {
          var data = {
            user: user,
            callbackUrl: req.app.locals.settings.general.clientUrl + '/login'
          };

          req.app.locals.mailer.sendEmail(
            'password_reset',
            user.email,
            data,
            req.i18n,
            function (err) {
              if (err) {
                return res.json(
                  messages.error(req.i18n.t('user.reset_pwd.token.error'))
                );
              } else {
                return res.json(
                  messages.success(req.i18n.t('user.reset_pwd.token.success'))
                );
              }
            }
          );
        } else {
          req.flash(
            'error',
            req.i18n.t('user.reset_pwd.form.error.user.not_found')
          );
          res.render('users/forgot_password', {
            title: req.i18n.t('user.reset_pwd.form.title'),
            message: req.flash('error')
          });
        }
      }
    }
  );
};

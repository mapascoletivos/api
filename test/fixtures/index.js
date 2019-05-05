const { join } = require('path');
const { emptyDir } = require('fs-extra');
const rosie = require('rosie').Factory;
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Layer = mongoose.model('Layer');
const Image = mongoose.model('Image');

const config = require('config');
const imagesPath = join(__dirname, '..', '..', ...config.get('imagesPath'));
const imageFixturePath = join(__dirname, 'image-1.png');

/**
 * User factory
 **/
rosie
  .define('User')
  .sequence('name', function (i) {
    return 'user' + i;
  })
  .sequence('email', function (i) {
    return 'email' + i + '@example.com';
  })
  .attr('password', '123456')
  .attr('emailConfirmed', true);

/**
 * Layer factory
 **/
rosie
  .define('Layer')
  .sequence('title', function (i) {
    return 'Title for layer' + i;
  })
  .sequence('description', function (i) {
    return 'description for layer' + i;
  });

/**
 * Content factory
 **/
rosie
  .define('Content')
  .sequence('title', function (i) {
    return 'Title for content' + i;
  })
  .attr('sirTrevorData', function () {
    return [
      {
        type: 'text',
        data: { text: 'bbbb' }
      },
      {
        type: 'type'
      }
    ];
  });

rosie.define('Image').attr('sourcefile', join(__dirname, 'image-1.png'));

/**
 * Helper functions
 **/

exports.createUser = async function () {
  const fixture = rosie.build('User');
  let user = (await new User(fixture).save()).toJSON({
    transform: function (doc, ret, options) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
  user.password = fixture.password;
  return user;
};

exports.createLayer = async function (user) {
  if (!user) throw new Error('Missing user parameter.');

  // Create document
  const fixture = rosie.build('Layer');
  fixture.creator = user.id;
  return (await new Layer(fixture).save()).toJSON({
    transform: function (doc, ret, options) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
};

exports.createImage = async function (user) {
  if (!user) throw new Error('Missing user parameter.');
  return (await new Image({
    creator: user.id,
    files: { default: imageFixturePath }
  }).save()).toJSON({
    transform: function (doc, ret, options) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  });
};

/**
 * Empty database and remove temporary files.
 **/
exports.resetFixtures = async function () {
  await Promise.all([
    await emptyDir(imagesPath),
    await mongoose.model('Image').collection.deleteMany(),
    await mongoose.model('User').collection.deleteMany(),
    await mongoose.model('Content').collection.deleteMany(),
    await mongoose.model('Layer').collection.deleteMany()
  ]);
};

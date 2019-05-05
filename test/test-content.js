const config = require('config');
const { exists, existsSync } = require('fs-extra');
const { join } = require('path');
const {
  createImage,
  createLayer,
  createUser,
  resetFixtures
} = require('./fixtures');
const { getAccessToken, validResponseMessages } = require('./utils');
const _ = require('underscore');
const async = require('async');
const should = require('should');
const request = require('supertest');
const i18n = require('i18next');
const app = require('../web');

const mongoose = require('mongoose');
const Image = mongoose.model('Image');
const Layer = mongoose.model('Layer');

/**
 * Config
 */
const imagesPath = global.imagesPath;
const apiPrefix = '/api/v1';

const uploadedImagesPath = join(
  __dirname,
  '..',
  '..',
  'public',
  'uploads',
  'images'
);
i18n.init(config.get('i18n'));

/**
 * Local variables
 */

let user1AccessToken;
let user1;
let user2;
let content1Id;
let image1;
let image2;
let image3;
let imageFilenames = [];
let layer1;
let layer2;

/**
 * The tests
 */

describe('Contents', function () {
  before(async function () {
    await resetFixtures();

    user1 = await createUser();
    user1AccessToken = await getAccessToken(user1);
    user2 = await createUser();

    layer1 = await createLayer(user1);
    layer2 = await createLayer(user2);

    image1 = await createImage(user1);
    image2 = await createImage(user1);
    image3 = await createImage(user1);
  });

  /**
   * Create content
   */
  describe('POST /contents', function () {
    context('not logged in', function () {
      it('should return forbidden', function (done) {
        request(app)
          .post(apiPrefix + '/contents')
          .expect(401)
          .end(function (err, res) {
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            validResponseMessages(res.body).should.be.true();
            res.body.messages[0].should.have.property(
              'text',
              i18n.t('access_token.unauthorized')
            );
            done();
          });
      });
    });

    context('admin logged in', function () {
      it('can add content to any layer');
    });

    context('user1 logged in', function () {
      it('accepts a valid content creation request', function (done) {
        const payload = {
          layer: layer1.id,
          title: 'Content title',
          sections: [
            {
              type: 'text',
              data: {
                text: 'Some text'
              }
            },
            {
              type: 'yby_image',
              data: {
                _id: image1.id
              }
            },
            {
              type: 'video',
              data: {
                source: 'youtube',
                remote_id: 'M4spK4QeUKY'
              }
            },
            {
              type: 'list',
              data: {
                text: 'list items'
              }
            },
            {
              type: 'yby_image',
              data: {
                _id: image2.id
              }
            }
          ]
        };

        request(app)
          .post(apiPrefix + '/contents')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        function onResponse (err, res) {
          should.not.exist(err);

          var body = res.body;

          var section;

          // creator should be valid
          body['creator'].should.have.property('_id', user1.id);

          // layer should be valid

          body.should.have.property('layer', layer1.id);

          // sections should be valid
          body.sections.should.be.instanceof(Array).and.have.lengthOf(5);

          // first section
          section = body.sections[0];
          section.should.have.property('type', 'text');
          section.data.should.have.property('text', 'Some text');

          // second section
          section = body.sections[1];
          section.should.have.property('type', 'yby_image');
          section.data.should.have.property('_id', image1.id);
          section.data.should.have.property('files');

          // keep image filenames to check after removal
          _.each(section.data.files, function (file) {
            imageFilenames.push(file);
          });

          // third section
          section = body.sections[2];
          section.should.have.property('type', 'video');
          section.data.should.have.property('source', 'youtube');
          section.data.should.have.property('remote_id', 'M4spK4QeUKY');

          // fourth section
          section = body.sections[3];
          section.should.have.property('type', 'list');
          section.data.should.have.property('text', 'list items');

          // fifth section
          section = body.sections[4];
          section.should.have.property('type', 'yby_image');
          section.data.should.have.property('_id', image2.id);
          section.data.should.have.property('files');

          // keep image filenames to check after removal
          _.each(section.data.files, function (file) {
            imageFilenames.push(file);
          });

          // save content id for later loading
          content1Id = res.body._id;

          done();
        }
      });

      it('should return error when section as invalid image data', function (done) {
        var payload = {
          layer: layer1.id,
          title: 'Content title',
          sections: [
            {
              type: 'text',
              data: {
                text: 'Some text'
              }
            },
            {
              type: 'yby_image',
              data: {
                noid: 'noid'
              }
            }
          ]
        };

        request(app)
          .post(apiPrefix + '/contents')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect('Content-Type', /json/)
          .expect(400)
          .end(onResponse);

        function onResponse (err, res) {
          should.not.exist(err);
          res.body.messages.should.have.lengthOf(1);
          validResponseMessages(res.body).should.be.true();
          res.body.messages[0].should.have.property(
            'text',
            i18n.t('mongoose.errors.content.malformed_sections')
          );
          done();
        }
      });

      it('should return error when layer is invalid', function (done) {
        var payload = {
          layer: 'invalidid',
          title: 'Content title'
        };

        request(app)
          .post(apiPrefix + '/contents')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect('Content-Type', /json/)
          .expect(400)
          .end(onResponse);

        function onResponse (err, res) {
          should.not.exist(err);
          res.body.messages.should.have.lengthOf(1);
          validResponseMessages(res.body).should.be.true();
          res.body.messages[0].should.have.property(
            'text',
            i18n.t('content.create.error.invalid_layer')
          );
          done();
        }
      });

      it('should return error when user do not own layer', function (done) {
        var payload = {
          layer: layer2.id,
          title: 'Content title'
        };

        request(app)
          .post(apiPrefix + '/contents')
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect('Content-Type', /json/)
          .expect(403)
          .end(onResponse);

        function onResponse (err, res) {
          should.not.exist(err);
          res.body.messages.should.have.lengthOf(1);
          validResponseMessages(res.body).should.be.true();
          res.body.messages[0].should.have.property(
            'text',
            i18n.t('content.create.error.layer_not_owned')
          );
          done();
        }
      });
    });
  });

  describe('PUT /contents', function () {
    context('not logged in', function () {
      it('should return forbidden', function (done) {
        request(app)
          .put(apiPrefix + '/contents/' + content1Id)
          .expect(401)
          .end(function (err, res) {
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            validResponseMessages(res.body).should.be.true();
            res.body.messages[0].should.have.property(
              'text',
              i18n.t('access_token.unauthorized')
            );
            done();
          });
      });
    });

    context('logged in', function () {
      it('should change content sections accordingly', function (doneIt) {
        const payload = {
          layer: 'oaiosdiasodi', // this attribute shouldn't be changed
          title: 'Content title',
          sections: [
            {
              type: 'text',
              data: {
                text: 'Lorem ipsum'
              }
            },
            {
              type: 'video',
              data: {
                source: 'youtube',
                remote_id: 'M4spK4QeUKY'
              }
            },
            {
              type: 'yby_image',
              data: {
                _id: image1.id
              }
            },
            {
              type: 'yby_image',
              data: {
                _id: image3.id
              }
            },
            {
              type: 'list',
              data: {
                text: 'list items'
              }
            }
          ]
        };

        request(app)
          .put(apiPrefix + '/contents/' + content1Id)
          .set('Authorization', user1AccessToken)
          .send(payload)
          .expect(200)
          .end(onResponse);

        function onResponse (err, res) {
          should.not.exist(err);

          var body = res.body;

          var section;

          // creator should be valid
          body.should.have.property('creator');
          body.creator.should.have.property('_id', user1.id);
          body.creator.should.have.property('name', user1.name);
          body.creator.should.have.property('email', user1.email);

          // layer should be valid
          body.should.have.property('layer');
          body.layer.should.have.property('_id', layer1.id);

          // sections should be valid
          body.sections.should.be.instanceof(Array).and.have.lengthOf(5);

          // section 1
          section = body.sections[0];
          section.should.have.property('type', 'text');
          section.data.should.have.property('text', 'Lorem ipsum');

          // section 2
          section = body.sections[1];
          section.should.have.property('type', 'video');
          section.data.should.have.property('source', 'youtube');
          section.data.should.have.property('remote_id', 'M4spK4QeUKY');

          // section 3
          section = body.sections[2];
          section.should.have.property('type', 'yby_image');
          section.data.should.have.property('_id', image1.id);
          section.data.should.have.property('files');

          // section 4
          section = body.sections[3];
          section.should.have.property('type', 'yby_image');
          section.data.should.have.property('_id', image3.id);
          section.data.should.have.property('files');

          // keep image filenames to check after removal
          _.each(section.data.files, function (file) {
            imageFilenames.push(file);
          });

          // section 5
          section = body.sections[4];
          section.should.have.property('type', 'list');
          section.data.should.have.property('text', 'list items');

          // check if image2 files where removed
          async.eachSeries(
            image2.files,
            function (filename, doneEach) {
              var filepath = uploadedImagesPath + filename;
              existsSync(filepath).should.be.false();
              doneEach();
            },
            doneIt
          );
        }
      });
    });
  });

  describe('DEL /contents', function () {
    context('not logged in', function () {
      it('should return forbidden', function (done) {
        request(app)
          .del(apiPrefix + '/contents/' + content1Id)
          .expect(401)
          .end(function (err, res) {
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            validResponseMessages(res.body).should.be.true();
            res.body.messages[0].should.have.property(
              'text',
              i18n.t('access_token.unauthorized')
            );
            done();
          });
      });
    });

    context('when logged in', function () {
      it('should delete content and images', function (doneIt) {
        request(app)
          .del(apiPrefix + '/contents/' + content1Id)
          .set('Authorization', user1AccessToken)
          .expect(200)
          .end(async function (err, res) {
            should.not.exist(err);

            res.body.messages.should.have.lengthOf(1);
            validResponseMessages(res.body).should.be.true();
            res.body.messages[0].should.have.property(
              'text',
              i18n.t('content.destroy.success')
            );

            // Image documents should be gone.
            should(await Image.findById(image1.id)).be.null();
            should(await Image.findById(image2.id)).be.null();

            // Image files should be gone.
            for (const filename of imageFilenames) {
              should(await exists(join(imagesPath, filename))).be.false();
            }

            // Content should not be part of layer.
            const layer = await Layer.findById(layer1.id);
            should(layer).not.be.null();
            should(layer.contents).not.containEql(content1Id);

            doneIt();
          });
      });
    });
  });
});

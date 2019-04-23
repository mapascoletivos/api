const path = require('path');
const async = require('async');
const fs = require('fs');
const should = require('should');
const request = require('supertest');
const i18n = require('i18next');
const app = require('../../web');
const mongoose = require('mongoose');
const Image = mongoose.model('Image');
const helper = require('../../lib/test-helper');
const factory = require('../../lib/factory');
const messages = require('../../lib/messages');
const clear = require('../../lib/clear');

const config = require('../../server/config')['test'];

const apiPrefix = '/api/v1';

const imageFixturePath = path.join(
  __dirname,
  '..',
  '..',
  'fixtures',
  'image-1.png'
);

const uploadedImagesPath = path.join(
  __dirname,
  '..',
  '..',
  'public',
  'uploads'
);

i18n.init(config.i18n);

/**
 * Local variables
 */

var user1AccessToken, user1, image1, layer1;

/**
 * The tests
 */

describe('Images API', function () {
  before(function (doneBefore) {
    function createUserAndLogin (doneCreateUserAndLogin) {
      factory.createUser(function (err, usr) {
        should.not.exist(err);
        user1 = usr;
        helper.login(user1.email, user1.password, function (token) {
          user1AccessToken = token;
          doneCreateUserAndLogin();
        });
      });
    }

    function createLayer (doneCreateLayer) {
      factory.createLayer(user1, function (err, layer) {
        should.not.exist(err);
        layer1 = layer;
        doneCreateLayer();
      });
    }

    helper.whenExpressReady(function () {
      clear.all(function (err) {
        should.not.exist(err);
        async.series([createUserAndLogin, createLayer], doneBefore);
      });
    });
  });

  after(function (done) {
    clear.all(function (err) {
      should.not.exist(err);
      done(err);
    });
  });

  /**
   * Create Image
   */
  describe('POST /images', function () {
    context('not logged in', function () {
      it('should return unauthorized', function (done) {
        request(app)
          .post(apiPrefix + '/images')
          .expect(401)
          .end(function (err, res) {
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            messages.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property(
              'text',
              i18n.t('access_token.unauthorized')
            );
            done();
          });
      });
    });

    context('logged in', function () {
      it('accepts a valid image creation request', function (done) {
        request(app)
          .post(apiPrefix + '/images')
          .set('Authorization', user1AccessToken)
          .attach('attachment[file]', imageFixturePath) // attach like SirTrevor does
          .expect('Content-Type', /json/)
          .expect(200)
          .end(onResponse);

        function onResponse (err, res) {
          should.not.exist(err);
          should.exist(res.body.files.mini);
          should.exist(res.body.files.thumb);
          should.exist(res.body.files.default);
          should.exist(res.body.files.large);
          user1._id.equals(res.body.creator._id).should.be.true;

          // thumb image file is saved properly
          const thumbFilename = path.join(uploadedImagesPath, res.body.files.thumb);
          fs.existsSync(thumbFilename).should.be.true;
          var thumbSize = fs.statSync(thumbFilename).size;
          thumbSize.should.be.above(0);

          // mini image file is saved properly
          const miniFilename = path.join(uploadedImagesPath, res.body.files.mini);
          fs.existsSync(miniFilename).should.be.true;
          var miniSize = fs.statSync(miniFilename).size;
          miniSize.should.be.above(thumbSize);

          // default image file is saved properly
          const defaultFilename = path.join(uploadedImagesPath, res.body.files.default);
          fs.existsSync(defaultFilename).should.be.true;
          var defaultSize = fs.statSync(defaultFilename).size;
          defaultSize.should.be.above(miniSize);

          // large image file is saved properly
          const largeFilename = path.join(uploadedImagesPath, res.body.files.large);
          fs.existsSync(largeFilename).should.be.true;
          var largeSize = fs.statSync(largeFilename).size;
          largeSize.should.be.above(defaultSize);

          Image.findOne({}, function (err, img) {
            should.not.exist(err);

            user1._id.equals(img.creator).should.be.true;

            user1._id.equals(img.creator).should.be.true;
            should(img.filename).equal(res.body.filename);

            // old properties that should be gone
            should.not.exist(img.file);
            should.not.exist(img.content);

            // keep image object to test file removal
            image1 = img;

            done();
          });
        }
      });

      it('missing attachment');
      it('invalid image');
    });
  });

  describe('POST /content with image', function () {
    context('not logged in', function () {
      it('should return forbidden', function (done) {
        request(app)
          .post(apiPrefix + '/contents')
          .expect(401)
          .end(function (err, res) {
            should.not.exist(err);
            res.body.messages.should.have.lengthOf(1);
            messages.hasValidMessages(res.body).should.be.true;
            res.body.messages[0].should.have.property(
              'text',
              i18n.t('access_token.unauthorized')
            );
            done();
          });
      });
    });

    context('logged in', function () {
      it('should hage image item properly', function (done) {
        var payload = {
          layer: layer1._id,
          type: 'Post',
          title: 'A content',
          sirTrevorData: [
            {
              type: 'text',
              data: {
                text: 'Some text'
              }
            },
            {
              type: 'yby_image',
              data: {
                id: image1.id
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
          done();
        }
      });
    });
  });

  /**
   * Delete images when content is removed
   */
  describe('DEL /content', function () {
    context('logged in', function () {
      it('should delete images when content is deleted');
    });
  });
});

const path = require('path');
const fs = require('fs');
const _ = require('underscore');
const async = require('async');
const should = require('should');
const request = require('supertest');
const i18n = require('i18next');
const app = require('../../web');
const mongoose = require('mongoose');
const Image = mongoose.model('Image');
const Layer = mongoose.model('Layer');
const helper = require('../../lib/test-helper');
const factory = require('../../lib/factory');
const messages = require('../../lib/messages');
const clear = require('../../lib/clear');

/**
 * Config
 */

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
  'uploads',
  'images'
);
const config = require('config');
i18n.init(config.get('i18n'));

/**
 * Local variables
 */

var user1AccessToken;

var user1;

var user2;

var admin;

var content1Id;

var image1;

var image2;

var image3;

var imageFilenames = [];

var layer1;

var layer2;

/**
 * The tests
 */

describe('Contents', function () {
  before(function (doneBefore) {
    /*
     * Create user1, user2 and admin
     */
    function createUsers (doneCreateUsers) {
      async.series(
        [
          function (done) {
            factory.createUser(function (err, usr) {
              should.not.exist(err);
              user1 = usr;
              helper.login(user1.email, user1.password, function (token) {
                user1AccessToken = token;
                done();
              });
            });
          },
          function (done) {
            factory.createUser(function (err, usr) {
              should.not.exist(err);
              user2 = usr;
              done();
            });
          },
          function (done) {
            factory.createUser(function (err, usr) {
              should.not.exist(err);
              admin = usr;
              admin.role = 'admin';
              done();
            });
          }
        ],
        doneCreateUsers
      );
    }

    /*
     * Create layer1 and layer2, associated to users
     */
    function createLayers (doneCreateLayers) {
      async.series(
        [
          function (done) {
            factory.createLayer(user1, function (err, layer) {
              should.not.exist(err);
              layer1 = layer;
              done();
            });
          },
          function (done) {
            factory.createLayer(user2, function (err, layer) {
              should.not.exist(err);
              layer2 = layer;
              done();
            });
          }
        ],
        doneCreateLayers
      );
    }

    /*
     * Create image
     */
    function createImages (doneCreateImages) {
      async.parallel(
        [
          function (done) {
            image1 = new Image({
              creator: user1,
              // will store uploaded file path, which will be saved at pre-save hook
              files: { default: imageFixturePath }
            });
            image1.save(function (err) {
              should.not.exist(err);
              done();
            });
          },
          function (done) {
            image2 = new Image({
              creator: user1,
              files: { default: imageFixturePath }
            });
            image2.save(function (err) {
              should.not.exist(err);
              done();
            });
          },
          function (done) {
            image3 = new Image({
              creator: user1,
              files: { default: imageFixturePath }
            });
            image3.save(function (err) {
              should.not.exist(err);
              done();
            });
          }
        ],
        doneCreateImages
      );
    }

    helper.whenExpressReady(function () {
      clear.all(function (err) {
        should.not.exist(err);
        async.series([createUsers, createLayers, createImages], doneBefore);
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
            messages.hasValidMessages(res.body).should.be.true;
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
        var payload = {
          layer: layer1._id,
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
                _id: image1._id
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
                _id: image2._id
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
          body['creator'].should.have.property('_id', user1._id.toString());

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
          layer: layer1._id,
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
          messages.hasValidMessages(res.body).should.be.true;
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
          messages.hasValidMessages(res.body).should.be.true;
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
          messages.hasValidMessages(res.body).should.be.true;
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
      it('should change content sections accordingly', function (doneIt) {
        var payload = {
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
                _id: image1._id
              }
            },
            {
              type: 'yby_image',
              data: {
                _id: image3._id
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
              fs.existsSync(filepath).should.be.false;
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
            messages.hasValidMessages(res.body).should.be.true;
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
          .end(onResponse);

        function onResponse (err, res) {
          should.not.exist(err);

          res.body.messages.should.have.lengthOf(1);
          messages.hasValidMessages(res.body).should.be.true;
          res.body.messages[0].should.have.property(
            'text',
            i18n.t('content.destroy.success')
          );

          function checkImageObjectsExistence (doneCheckImageObjectsExistence) {
            async.eachSeries(
              [image1, image2],
              function (imgId, doneEach) {
                Image.findById(imgId, function (err, img) {
                  should.not.exist(err);
                  should.not.exist(img);
                  doneEach();
                });
              },
              doneCheckImageObjectsExistence
            );
          }

          function checkImageFilesExistence (doneCheckImageFilesExistence) {
            async.eachSeries(
              imageFilenames,
              function (filename, doneEach) {
                var filepath = uploadedImagesPath + filename;
                fs.existsSync(filepath).should.be.false;
                doneEach();
              },
              doneCheckImageFilesExistence
            );
          }

          function checkRemovedFromLayer (doneCheckRemovedFromLayer) {
            Layer.findById(layer1.id, function (err, layer) {
              should.not.exist(err);
              should.exist(layer);
              layer.contents.should.not.containEql(content1Id);
              doneCheckRemovedFromLayer();
            });
          }

          async.series(
            [
              checkImageObjectsExistence,
              checkImageFilesExistence,
              checkRemovedFromLayer
            ],
            doneIt
          );
        }
      });
    });
  });
});

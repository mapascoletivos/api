const { createUser, createLayer, resetFixtures } = require('./fixtures');
const { exists, stat } = require('fs-extra');
const { getAccessToken, validResponseMessages } = require('./utils');
const i18n = require('i18next');
const path = require('path');
const request = require('supertest');
const should = require('should');

const apiPrefix = '/api/v1';
const app = global.server;
const uploadedImagesPath = global.imagesPath;
const imageFixturePath = path.join(__dirname, 'fixtures', 'image-1.png');
let user1, user1AccessToken, image1, layer1;

describe('Images API', function () {
  before(async function () {
    await resetFixtures();

    // Create test objects
    user1 = await createUser();
    user1AccessToken = await getAccessToken(user1);
    layer1 = await createLayer(user1);
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
            should(validResponseMessages(res.body)).be.true();
            res.body.messages[0].should.have.property(
              'text',
              i18n.t('access_token.unauthorized')
            );
            done();
          });
      });
    });

    context('logged in', function () {
      it('accepts a valid image creation request', async function () {
        const { body } = await request(app)
          .post(apiPrefix + '/images')
          .set('Authorization', user1AccessToken)
          .attach('attachment[file]', imageFixturePath) // attach like SirTrevor does
          .expect('Content-Type', /json/)
          .expect(200);

        should.exist(body.files.mini);
        should.exist(body.files.thumb);
        should.exist(body.files.default);
        should.exist(body.files.large);
        should(body.creator).be.type('string');

        /*
         * Verify if files have increasing size, starting by "mini" format.
         */
        const thumbFilename = path.join(uploadedImagesPath, body.files.thumb);
        should(await exists(thumbFilename)).be.true();
        const { size: thumbSize } = await stat(thumbFilename);
        thumbSize.should.be.above(0);

        const miniFilename = path.join(uploadedImagesPath, body.files.mini);
        should(await exists(miniFilename)).be.true();
        const { size: miniSize } = await stat(miniFilename);
        miniSize.should.be.above(thumbSize);

        const defaultFilename = path.join(
          uploadedImagesPath,
          body.files.default
        );
        should(await exists(defaultFilename)).be.true();
        const { size: defaultSize } = await stat(defaultFilename);
        defaultSize.should.be.above(miniSize);

        const largeFilename = path.join(uploadedImagesPath, body.files.large);
        should(await exists(largeFilename)).be.true();
        const { size: largeSize } = await stat(largeFilename);
        largeSize.should.be.above(defaultSize);

        should(body.creator).equal(user1.id);

        image1 = body;
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
      it('should post image item properly', function (done) {
        const payload = {
          layer: layer1.id,
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
          .end((err, res) => {
            should.not.exist(err);
            done();
          });
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

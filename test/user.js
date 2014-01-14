
/*
 * Module dependencies.
 */

var request = require('supertest')
	, should = require('should')
	, app = require('../server');


describe('User controller', function() {
  describe('/signin', function() {
    describe('with good credentials', function() {
      var agent = request.agent(app);
      it('should create a user session', loginUser(agent));
    });
    describe('with bad credentials', function() {
      var agent = request.agent(app);
      it('should be rejected', function(done) {
        agent
          .post('/signin')
          .send({ email: 'test@dummy.com', password: 'wrong' })
          .end(onResponse);

        function onResponse(err, res) {
          res.should.have.status(200);
          res.redirects.should.eql(['/']);
          res.text.should.include('Sorry, that username or password was not found');
          return done();
        }
      });
    });
  });
  describe('/signout', function() {
    var agent = request.agent(app);
    it('should start with signin', loginUser(agent));
    it('should sign the user out', function(done) {
      agent.get('/signout').end(function(err, res) {
        res.should.have.status(200);
        res.redirects.should.eql(['/']);
        res.text.should.include('Who are you?');
        return done();
      });
    });
    it('should destroy the user session', function(done) {
      agent.get('/dashboard').end(function(err, res) {
        res.should.have.status(200);
        res.redirects.should.eql(['/']);
        res.text.should.include('Please log in first');
        return done();
      });
    });
  });
  describe('/', function() {
    var agent = request.agent(app);

    before(loginUser(agent));

    it('should redirect to dashboard if user is logged in', function(done) {
      agent.get('/').end(function(err, res) {
        res.should.have.status(200);
        res.redirects.should.eql(['/dashboard']);
        res.text.should.include('Dashboard');
        return done();
      });
    });

    it('should render signin if user is not logged in', function(done) {
      var anon = request.agent(app);
      anon.get('/').end(function(err, res) {
        res.should.have.status(200);
        res.redirects.should.eql([]);
        res.text.should.include('Who are you?');
        return done();
      });
    });
  });
});

function loginUser(agent) {
  return function(done) {
    agent
      .post('/signin')
      .send({ email: 'test@dummy.com', password: 'bacon' })
      .end(onResponse);

    function onResponse(err, res) {
      res.should.have.status(200);
      res.text.should.include('Dashboard');
      return done();
    }
  };
}

/*
 * Module dependencies.
 */

var request = require('supertest')
	, should = require('should')
	, app = require('../web')
	, mongoose = require('mongoose')
	, User = mongoose.model('User')	;


describe('User controller', function() {
	
	before(function (done) {
		// Clear DB before testing
		User.collection.remove(function(){
			// Then creates API User
			var user = new User({
				email: 'foobar@example.com',
				name: 'Foo bar',
				username: 'foobar',
				password: 'foobar'
			});
			user.save(done);
		});
	});

	describe('POST /users/session', function() {
		
		describe('with good credentials', function() {
			var agent = request.agent(app);
			it('should create a user session', loginUser(agent));
		});
		
		describe('with bad credentials', function() {
			var agent = request.agent(app);
			it('should be rejected', function(done) {
				agent
					.post('/users/session')
					.send({ email: 'test@dummy.com', password: 'wrong' })
					.end(function(err,res){
						res.should.have.status(302);
						res.header['location'].should.include(['/login']);
						return done();
					});
			});
		});
	});

	describe('/signout', function() {
	
		var agent = request.agent(app);
	
		it('should start with signin', loginUser(agent));
		
		it('should log the user out', function(done) {
			agent.get('/logout').end(function(err, res) {
				res.should.have.status(302);
				res.header['location'].should.include(['/login']);
				return done();
			});
		});
		
		it('should destroy the user session');
	});
});

function loginUser(agent) {
	return function(done) {
		agent
		.post('/users/session')
		.send({ email: 'foobar@example.com', password: 'foobar' })
		.end(onResponse);

		function onResponse(err, res) {
			// test redirect to dashboard
			res.should.have.status(302); 
			res.header['location'].should.not.include('/login');
			return done();
		}
	}
}

/*
 * Module dependencies.
 */

var request = require('supertest'),
	should = require('should'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	Layer = mongoose.model('Layer'),
	User = mongoose.model('User'),
	Content = mongoose.model('Content');

var apiPrefix = '/api/v1';

var 
	user,
	layerCounter;


describe('API', function(){

	before(function (done) {
		// Clear DB before testing
		Layer.collection.remove(function(){		
			Content.collection.remove(function(){
				User.collection.remove(function(){
					// Then creates API User
					user = new User({
						email: 'foobar@example.com',
						name: 'Foo bar',
						username: 'foobar',
						password: 'foobar'
					});
					user.save(done);
				});
			});
		});
	});
	
	/**
	 * Layer tests
	 **/

	describe('Layers', function(){	
		describe('POST /layers', function(){
			context('When not logged in', function(){
				it('should redirect to /login', function (done) {
					request(app)
						.post(apiPrefix + '/layers')
						.expect('Content-Type', /plain/)
						.expect(302)
						.expect('Location', '/login')
						.expect(/Moved Temporarily/)
						.end(done)
				})
			});
			
			context('When logged in', function(){

				var agent = request.agent(app);
				
				before(loginRegularUser(agent))
				
				describe('Invalid parameters', function(){
					
					before(function(done){
						Layer.count(function(err,cnt){
							layerCount = cnt;
							done();
						})
					})
					
					it('should respond with error', function(done){
						agent
							.post(apiPrefix + '/layers')
							.field('title', '')
							.expect('Content-Type', /json/)
							.expect(400)
							.expect(/Path `title` is required./)
							.end(done)
					});
					
					it('should not save to database');
				})
				
				describe('Valid parameters', function(){
					it('should insert a record to database');
					it('should save the layer');
				});
			});
		});
	});
	
	/**
	 * Content tests
	 **/
	
	describe('Contents', function(){
		var contentId;
		
		// populate some content
		before(function(done){
			
			var layer = new Layer({
				creator: user,
				title: 'Content test'
			});
			
			var content = new Content({
				type: 'Markdown',
				title: 'Title of content',
				layer: layer
			});
			

			layer.contents.push(content);

			// save all
			layer.save(function(err){
				content.save(function(err){
					contentId = content._id;
					done();
				});
			});
		})
		
		describe('DEL ' + apiPrefix +'/contents', function(){
			context('When not logged in', function(){
				it('should redirect to /login', function (done) {
					request(app)
						.del(apiPrefix + '/contents/' + contentId)
						.expect('Content-Type', /plain/)
						.expect(302)
						.expect('Location', '/login')
						.expect(/Moved Temporarily/)
						.end(done)
				});
			});
			
			context('When logged in', function(){
				var 
					agent = request.agent(app),
					contentCount;
				
				before(function(done){
					Content.count(function(err,cnt){
						contentCount = cnt;
						loginRegularUser(agent)(done);
					})
				});
				
				it('should return true', function(done){
					agent
						.del(apiPrefix + '/contents/' + contentId)
						.expect('Content-Type', /json/)
						.expect(200)
						.expect(/true/)
						.end(done)
				})
				
				it('should delete a record to the database', function (done) {
					Content.count(function (err, cnt) {
						cnt.should.equal(contentCount - 1)
						done()
					});
				});
			});
		});
	});
});

function loginRegularUser(agent){
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
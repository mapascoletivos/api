
/**
 * Module dependencies.
 **/

var 
	rosie = require('rosie').Factory,
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Feature = mongoose.model('Feature'),
	Content = mongoose.model('Content'),
	Layer = mongoose.model('Layer');

/**
 * The factories
 **/

rosie.define('User')
	.sequence('name', function(i) { return 'user' + i }) 
	.sequence('email', function(i) { return 'email' + i + '@example.com' })
	.attr('password', '123456')
	.attr('emailConfirmed', true)

rosie.define('Layer')
	.sequence('title', function(i) { return 'Title for layer' + i }) 
	.sequence('description', function(i) { return 'description for layer' + i }) 

rosie.define('Content')
	.sequence('title', function(i) { return 'Title for content' + i }) 
	.attr('sirTrevorData', function(){ 
		return [{
			type: 'text',
			data: {text: 'bbbb'}
		}, {
			type: 'type'
		}]
	})

rosie.define('Image')
	.attr('sourcefile', __dirname + '../fixtures/image-1.png');

/**
 * Helper functions
 **/

exports.createUser = function(done){
	var user = new User(rosie.build('User'));
	user.save(function(err){
		done(err, user);
	})
}

exports.createLayer = function(user, done){
	var layer = new Layer(rosie.build('Layer'));
	layer.creator = user;
	layer.save(function(err){
		done(err, layer);
	})
}

/**
 * Module dependencies.
 */

var 
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Category = mongoose.model('Category'),
	Map = mongoose.model('Map'),
	mysql = require('mysql'),
	async = require('async');
	

var importUsers = function(mysqlConnection, callback) {
	mysqlConnection.query('SELECT * from mapascol_ushahidi.users', function(err, rows, fields) {
	  if (err) throw err;

	  async.each(rows, function(row, cb){
		  User.findOne({email: row['email']}, function(err, usr){

		  	// Create new user if it don't exist
		  	if (!usr) 
		  		usr = new User();
	  		
	  		usr.oldId = row['id'];
	  		usr.name = row['name'];
	  		usr.email = row['email'];
	  		usr.username = row['username'];
	  		usr.hashed_password = row['password'];
	  		usr.password = row['password'];
	  		usr.logins = row['logins'];
	  		if (row['last_login']) {
	  			usr.lastLogin = new Date();
	  			usr.lastLogin.setTime(row['last_login'] + '000');
	  		}
	  		usr.updatedAt = row['updated'];
	  		usr.localization = row['localization'];
	  		usr.bio = row['bio'];
	  		usr.web = row['web'];

		  	usr.save(function(err){
		  		cb(err);
		  	});
		  });
		  
	  }, function(errors){
	  	callback(errors);
	  });
	});
} 

var importCategories = function(mysqlConnection, callback) {
	mysqlConnection.query('SELECT * from mapascol_ushahidi.category', function(err, rows, fields) {
	  if (err) throw err;

	  async.each(rows, function(row, cb){

	  	var category = new Category();

  		category.oldId = row['id'];
  		category.title = row['category_title'];
  		category.description = row['category_description'];
  		category.color = row['category_color'];
  		category.save(cb);
		  
	  }, function(errors){
	  	callback(errors);
	  });
	});
}

var importMaps = function(mysqlConnection, callback) {
	mysqlConnection.query('SELECT * from mapascol_ushahidi.incident', function(err, rows, fields) {
	  if (err) throw err;

	  async.each(rows, function(row, cb){

	  	var map = new Map();

  		map.oldId = row['id'];
  		map.title = row['incident_title'];
  		map.description = row['incident_description'];
  		map.updatedAt = row['incident_date'];
  		map.createdAt = row['incident_dateadd'];
  		map.center = [row['incident_default_lat'], row['incident_default_lon']];
  		map.zoom = row['incident_default_zoom'];
	  	map.isDraft = false;

  		User.findOne({oldId: row['owner_id']}, function(err, user){
  			if (err) cb(err);
  			if (!user) console.log('usuário não encontrado!!!');

  			map.creator = user;

  			// find categories
  			mysqlConnection.query('SELECT * from mapascol_ushahidi.incident_category where incident_id='+map.oldId, function(err, catRows, fields) {
  				async.each(catRows, function(catRow, done){
						Category.findOne({oldId: catRow.category_id}, function(err, cat){
  						map.categories.push(cat);
  						done(err);
  					});
  				}, function(errs){
  					map.save(cb);
  				});
  			});
  		})
	  }, function(errors){
	  	callback(errors);
	  });
	});
}



exports.import = function(req,res){

	connection = mysql.createConnection({
	  host     : process.env.MC_MYSQL_HOST,
	  user     : process.env.MC_MYSQL_USER,
	  password : process.env.MC_MYSQL_PASSWORD,
	  database : process.env.MC_MYSQL_DATABASE
	});

	connection.connect();

	importUsers(connection, function(err) {
		if (!err)
			importCategories(connection, function(err){
				console.log(err);
				importMaps(connection, function(err){
					console.log(err)
					connection.end();
					res.render('home/import');
				});
			});
		else
			res.render('home/import');
	});

	

}
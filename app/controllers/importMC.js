
/**
 * Module dependencies.
 */

var 
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Category = mongoose.model('Category'),
	Map = mongoose.model('Map'),
	Layer = mongoose.model('Layer'),
	Feature = mongoose.model('Feature'),
	mysql = require('mysql'),
	async = require('async');

var
	layerTable = {};

var clearDb = function(callback) {
	async.parallel([
		function(cb) {
			User.remove(cb);
		},
		function(cb) {
			Category.remove(cb);
		},
		function(cb) {
			Map.remove(cb);
		},
		function(cb) {
			Layer.remove(cb);
		}
	], callback);
}	

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
	  		// usr.hashed_password = row['password'];
	  		usr.password = 'a';
	  		usr.status = 'active';
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
  						if (cat)
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

/**
 * Load layers table in memory
 */

var importLayers = function(mysqlConnection, callback){
	mysqlConnection.query('SELECT * from mapascol_ushahidi.location_layer', function(err, rows, fields) {
		
		async.each(rows, function(row, cb){

			Map.findOne({oldId: row['incident_id']}, function(err, map){

				var layer = new Layer({
					oldId: row['id'],
					color: row['layer_color'],
					title: row['layer_name'],
					isDraft: false
				})

				if (err) {
					console.log('Houve um erro adicionando layer:'+row);
					console.log(row);
					cb(err);
				} else {
					
					if (!map) {
						// can't find belonging map, if owner_id is defined, use it to create layer
						User.findOne({oldId: row['owner_id']}, function(err, user){
							if ((err) || (!user)) {
								console.log("Layer creation: can't find incident_id ("+row['incident_id']+") or owner_id ("+row['owner_id']+") for layer " +row['id']);
								cb(err);
							} else {
								layer.creator = user;
								layer.save(cb);
							}
						})
					} else {
						layer.maps.addToSet(map);
						layer.creator = map.creator;
						layer.save(function(err){
							if (err) cb(err);
							map.layers.addToSet(layer);
							map.save(cb);
						});
					}
				} 




			});
		},callback)

	});
}

/**
 * Import features
 */

var importFeatures = function(mysqlConnection, callback){
	mysqlConnection.query('SELECT * from mapascol_ushahidi.location', function(err, rows, fields) {



		async.eachSeries(rows, function(row, cb){

			// Ignore locations with layer_id=0
			if (row['layer_id'] == '0') {
				console.log('Feature with layer_id=0' + '. Ignoring location...')
				cb();

			} else {

				// find creator
				User.findOne({oldId: row['owner_id']}, function(err, user){
					if (!user) {
						console.log('Creator not found for id '+row['owner_id'] + '. Ignoring location...');
						cb();
					}
					else {

						// Find or create layer
						Layer.findOne({oldId: row['layer_id']}, function(err, layer){
							if (err) {
								console.log(err);	
								callback(err);
							}
							else {

								// Layer not found, create a new on
								if (!layer) {
									// console.log('Layer not found for id='+row['layer_id']+' and creator='+user.name);
									// layer = new Layer({
									// 	oldId: row['layer_id'],
									// 	title: layerTable[row['layer_id']].name,
									// 	isDraft: false,
									// 	creator: user
									// })
									console.log('Layer não encontrado: ' + row['layer_id']);
									cb();
								} else {

									// Add location to layer
									var feature = new Feature({
										creator: user,
										layers: [layer],
										title: row['location_name'],
										description: row['location_description'],
										geometry: { type: 'Point', coordinates: [row['latitude'], row['longitude']]},
										createdAt: row['location_date']
									})

									layer.features.addToSet(feature);

									// Save both Layer and Feature
									layer.save(function(err){
										if (err)
											console.log(err);
										feature.save(cb);
									});
								}

								
							}
						})

					}
				})
			}
		},callback)
		
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

	clearDb(function(err){
		importUsers(connection, function(err) {
			if (err) {
				console.log(err);
				res.render('home/import');
			} else
				importMaps(connection, function(err){
					if (err) {
						console.log(err);
						res.render('home/import');
					}
					importLayers(connection, function(err){
						if (err) {
							console.log(err);
							res.render('home/import');
						} else {
							importFeatures(connection, function(err){
								if (err) {
									console.log(err);
								}
								res.render('home/import');
							});
						}
					});

			});
		});
	});

}
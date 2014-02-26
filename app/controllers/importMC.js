
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
	Content = mongoose.model('Content'),
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
			Feature.remove(cb);
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
				usr.status = 'need_password_update';
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
 * Get media for feature
 */

var importContents = function(connection, callback ) {

	var 
		youtubeRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/,
		vimeoRegex = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/
		imageRegex = /\.(?:jpe?g|png|gif|JPE?G|PNG|GIF)$/,
		urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;    


	var buildSirTrevorData = function(medias, doneParseMedias) {

		var 
			sirTrevorData = [];
		
		// parse medias
		async.eachSeries(medias, function(media, doneParseMedia){

			// check media type
			switch (media['media_type']) {
				
				// image
				case 1:
					sirTrevorData.push({
						type: "image",
						data: {
							file: {
								name: media['media_link'],
								url: '/uploads/images/' + media['media_link']
							} 
						}
					});
					break;
				// video
				case 2:
					var 
						youtubeId = media['media_link'].match(youtubeRegex),
						vimeoId = media['media_link'].match(vimeoRegex);

					if (youtubeId && youtubeId[7].length==11){
						sirTrevorData.push({
							type: "video",
							data: {
								remote_id: youtubeId[7],
								source: "youtube" 
							}
						});
					} else if (vimeoId) {
						sirTrevorData.push({
							type: "video",
							data: {
								remote_id: vimeoId,
								source: "vimeo" 
							}
						});
					} 
					break;

				// link
				case 4:
					sirTrevorData.push({
						type: "text",
						data: {
							text: "["+media['media_link']+"]("+media['media_link']+")"
						}
					});
					break;
			}
			doneParseMedia();
		}, function(){
			doneParseMedias(sirTrevorData);
		});
	}


	// Get locations ids
	connection.query('SELECT distinct location_id from mapascol_ushahidi.media', function(err, locations, fields){
		

		async.eachSeries(locations, function(location, doneFeature){

			console.log('location\n'+JSON.stringify(location));
		
			// Get media associated to each location
			connection.query('SELECT * from mapascol_ushahidi.media WHERE location_id='+location['location_id'], function(err, medias, fields){

				console.log('location\n'+JSON.stringify(medias));
				if (medias.length == 0) {
					doneFeature();
				}

				// Retrieve associated feature
				Feature.findOne({oldId: location['location_id']}, function(err, feature){
					
					if ( (err) || (!feature)) {
						doneFeature();

					} else {

						Layer.findById(feature.layers[0], function(err, layer){

							var
								content = new Content();

							// sir trevor
							// content.sirTrevorData = buildSirTrevorData(medias);
							// content.sirTrevor = JSON.stringify(content.sirTrevorData);

							buildSirTrevorData(medias, function(sirTrevorData){

								content.sirTrevorData = sirTrevorData;
								content.sirTrevor = JSON.stringify(sirTrevorData);


								content.createdAt = feature.createdAt;
								content.updatedAt = feature.updatedAt;
								content.title = feature.title;

								// relationships
								content.layer = layer;
								layer.contents.addToSet(content);
								content.features.addToSet(feature);
								feature.contents.addToSet(content);

								content.save(function(err){
									if (err) console.log(err);
									feature.save(function(err){
										if (err) console.log(err);
										layer.save(function(err){
											if (err) console.log(err);
											doneFeature();
										});
									});
								});
							})
						});

					}
				})
			})
		}, callback);
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

								// Layer not found
								if (!layer) {

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
										createdAt: row['location_date'],
										oldId: row['id']
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
						});
					}
				});
			}
		},callback)
		
	});
}

exports.import = function(req,res){

	if ((req.query.password) && (req.query.password == process.env.IMPORT_PASSWORD)) {
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
					connection.end();
					return res.render('home/import');
				} 

				importMaps(connection, function(err){
					if (err) {
						console.log(err);
						connection.end();
						return res.render('home/import');
					}
					
					importLayers(connection, function(err){
						if (err) {
							console.log(err);
							connection.end();
							return res.render('home/import');
						} 

						importFeatures(connection, function(err){
							if (err) {
								console.log(err);
								connection.end();
								return res.render('home/import');
							}
							
							importContents(connection, function(err) {
								if (err) {
									console.log(err);
									connection.end();
									return res.render('home/import');
								}

								res.render('home/import');
								connection.end();
							});
						});
					});
				});
			});
		});
	} else {
		res.render('home/import');
	}


}

/**
 * Module dependencies
 */

var 
	_ = require('underscore'),
	https = require('https'),
	url = require('url'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var AreaSchema = new Schema({
	name: {type: String, required: true},
	code: String,
	type: {type: String, required: true}, 
	parent: {type: Schema.ObjectId, ref: 'Area'}
});


/**
 * Statics
 */

AreaSchema.statics = {

	upsertArea: function(properties, doneUpsert) {
		var Area = this;

		Area.findOne({name: properties.name, type: properties.type}, function(err, area){
			if (err) 
				doneUpsert(err);
			else if (area) 
				doneUpsert(null, area);
			else {
				area = new Area(properties);
				area.save(function(err){
					if (err) doneUpsert(err);
					else doneUpsert(null, area)
				});
			} 
		});
	},
	whichContains: function(geometry, doneWhichContains) {
		var Area = this;


		var createAreasFromNominatim = function(address_entries, doneCreatingAreas){
			var 
				entries = [],
				areas_objects = [];

			var keys = Object.keys(address_entries);

			keys.forEach(function (key) {
				entries.push({type: key, name: address_entries[key]})
			})

			console.log(entries);
			
			var parseEntries = function(entries_list, parent ) {

				var 
					entry = entries_list.pop();

				if (entry.type == 'country' || entry.type == 'country_code' ) {
					area_properties = {
						type: 'country',
						name: entry.name,
						code: (areas_list.country_code ? areas_list.country_code.toUpperCase() : null) 
					} 
					delete areas_list.country;
					delete areas_list.country_code;
				} else {
					console.log('creating ' + areas_list.country + ' ' + areas_list.country_code + ' in ' + parent)
					var last_entry = areas_list.pop();
					area_properties = {
						type: last_entry.key(),
						name: last_entry.value()
					}
				}

				console.log('create areas - after parsing '+ JSON.stringify(areas_list));

				area_properties.parent = parent;

				Area.upsertArea(area_properties, function(err, area){
					if (err){
						console.log('erro no upsert' + err);
						doneCreatingArea(err);	
					} 
					else {
						areas_objects.push(area);
						// console.log('areas_objects '+ areas_objects);
						// console.log(areas_list.properties().length);
						// it still has more areas to parse
						if (areas_list) {
							parseEntries(areas_list, area._id);
						} else {
							doneWhichContains(null, areas_objects)
						}
					}
				});
			}

			parseEntries(entries, null);
		}


		var 
			nominatim_query = {
				protocol: 'https:',
				host: 'nominatim.openstreetmap.org',
				pathname: '/reverse',
				query: {
					format: 'json',
					addressdetails: 1,
					zoom: 18,
					lon: geometry.coordinates[0],
					lat: geometry.coordinates[1]
				}
			}

		switch (geometry.type) {
			case 'Point':
				nominatim_query.query.lon = geometry.coordinates[0];
				nominatim_query.query.lat = geometry.coordinates[1];
			break;
			case 'LineString':
				nominatim_query.query.lon = geometry.coordinates[0][0];
				nominatim_query.query.lat = geometry.coordinates[0][1];
			break;
			case 'Polygon':
				nominatim_query.query.lon = geometry.coordinates[0][0][0];
				nominatim_query.query.lat = geometry.coordinates[0][0][1];
			break;
		}

		https.get(url.format(nominatim_query), function(response) {
			var body = '';

			if (response.statusCode == 200) {

				// read response stream
				response.on('data', function(d) {
					body += d;
				});

				response.on('end', function(){
					var response = JSON.parse(body);
					createAreasFromNominatim(response.address, doneWhichContains);
				});

			} else {
				console.log('not status code:' + response.statusCode);
				doneWhichContains(null, []);
			}

		}).on('error', function(e) {
			console.log(e);
			doneWhichContains(null, []);
		});

	}
}

mongoose.model('Area', AreaSchema);
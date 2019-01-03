var https = require('https');

var url = require('url');

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AreaSchema = new Schema({
  name: { type: String, required: true },
  code: String,
  type: { type: String, required: true },
  parent: { type: Schema.ObjectId, ref: 'Area' }
});

/**
 * Statics
 */

AreaSchema.statics = {
  upsertArea: function (properties, doneUpsert) {
    var Area = this;

    Area.findOne({ name: properties.name, type: properties.type }, function (
      err,
      area
    ) {
      if (err) doneUpsert(err);
      else if (area) doneUpsert(null, area);
      else {
        area = new Area(properties);
        area.save(function (err) {
          if (err) doneUpsert(err);
          else doneUpsert(null, area);
        });
      }
    });
  },
  whichContains: function (geometry, doneWhichContains) {
    var Area = this;

    var createAreasFromNominatim = function (
      addressEntries,
      doneCreatingAreas
    ) {
      var entries = [];

      var areasObjects = [];

      var keys = Object.keys(addressEntries);

      keys.forEach(function (key) {
        entries.push({ type: key, value: addressEntries[key] });
      });

      var parseEntries = function (entriesList, parent) {
        var entry = entriesList.pop();
        let areaProperties;

        // Ignore postcodes because they don't appear in hierarchical order
        if (entry.type === 'postcode') {
          if (entriesList.length > 0) {
            entry = entriesList.pop();
          } else {
            doneWhichContains(null, areasObjects);
          }
        }

        if (entry.type === 'country_code') {
          areaProperties = {
            type: 'country',
            code: entry.value.toUpperCase(),
            name: entry.value.toUpperCase()
          };

          // next entry is possible the contry name
          entry = entriesList.pop();
          if (entry.type === 'country') {
            areaProperties.name = entry.value;
          } else {
            // if not a country, put back on the list
            entriesList.push(entry);
          }
        } else {
          areaProperties = {
            type: entry.type,
            name: entry.value
          };
        }

        if (parent) areaProperties.parent = parent;

        Area.upsertArea(areaProperties, function (err, area) {
          if (err) {
            doneWhichContains(err);
          } else {
            areasObjects.push(area);

            // It still has more areas to parse?
            if (entriesList.length > 0) {
              parseEntries(entriesList, area._id);
            } else {
              doneWhichContains(null, areasObjects);
            }
          }
        });
      };

      parseEntries(entries, null);
    };

    var nominatimQuery = {
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
    };

    switch (geometry.type) {
      case 'Point':
        nominatimQuery.query.lon = geometry.coordinates[0];
        nominatimQuery.query.lat = geometry.coordinates[1];
        break;
      case 'LineString':
        nominatimQuery.query.lon = geometry.coordinates[0][0];
        nominatimQuery.query.lat = geometry.coordinates[0][1];
        break;
      case 'Polygon':
        nominatimQuery.query.lon = geometry.coordinates[0][0][0];
        nominatimQuery.query.lat = geometry.coordinates[0][0][1];
        break;
    }

    https
      .get(url.format(nominatimQuery), function (response) {
        var body = '';

        if (response.statusCode === 200) {
          // read response stream
          response.on('data', function (d) {
            body += d;
          });

          response.on('end', function () {
            var response = JSON.parse(body);
            if (response.address) {
              createAreasFromNominatim(response.address, doneWhichContains);
            } else doneWhichContains();
          });
        } else {
          doneWhichContains(null, []);
        }
      })
      .on('error', function (e) {
        doneWhichContains(null, []);
      });
  }
};

mongoose.model('Area', AreaSchema);

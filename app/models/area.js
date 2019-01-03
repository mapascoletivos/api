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
      address_entries,
      doneCreatingAreas
    ) {
      var entries = [];

      var areas_objects = [];

      var keys = Object.keys(address_entries);

      keys.forEach(function (key) {
        entries.push({ type: key, value: address_entries[key] });
      });

      var parseEntries = function (entries_list, parent) {
        var entry = entries_list.pop();

        // Ignore postcodes because they don't appear in hierarchical order
        if (entry.type === 'postcode') {
          if (entries_list.length > 0) {
            entry = entries_list.pop();
          } else {
            doneWhichContains(null, areas_objects);
          }
        }

        if (entry.type === 'country_code') {
          area_properties = {
            type: 'country',
            code: entry.value.toUpperCase(),
            name: entry.value.toUpperCase()
          };

          // next entry is possible the contry name
          entry = entries_list.pop();
          if (entry.type === 'country') {
            area_properties.name = entry.value;
          } else {
            // if not a country, put back on the list
            entries_list.push(entry);
          }
        } else {
          area_properties = {
            type: entry.type,
            name: entry.value
          };
        }

        if (parent) area_properties.parent = parent;

        Area.upsertArea(area_properties, function (err, area) {
          if (err) {
            doneWhichContains(err);
          } else {
            areas_objects.push(area);

            // It still has more areas to parse?
            if (entries_list.length > 0) {
              parseEntries(entries_list, area._id);
            } else {
              doneWhichContains(null, areas_objects);
            }
          }
        });
      };

      parseEntries(entries, null);
    };

    var nominatim_query = {
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

    https
      .get(url.format(nominatim_query), function (response) {
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
          console.log('not status code:' + response.statusCode);
          doneWhichContains(null, []);
        }
      })
      .on('error', function (e) {
        console.log(e);
        doneWhichContains(null, []);
      });
  }
};

mongoose.model('Area', AreaSchema);

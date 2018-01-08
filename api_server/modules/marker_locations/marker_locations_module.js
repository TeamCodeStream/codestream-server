// provide a module to handle requests associated with marker locations

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var MarkerLocations = require('./marker_locations');

// expose these restful routes
const MARKER_LOCATIONS_ROUTES = [
	{
		method: 'get',
		path: 'marker-locations',
		requestClass: require('./get_marker_locations_request')
	},
	{
		method: 'put',
		path: 'marker-locations',
		requestClass: require('./put_marker_locations_request')
	},
	{
		method: 'put',
		path: 'calculate-locations',
		requestClass: require('./calculate_marker_locations_request')
	}
];

class MarkerLocationsModule extends Restful {

	get collectionName () {
		return 'markerLocations';	// name of the data collection
	}

	get modelName () {
		return 'markerLocations';	// name of the data model
	}

	get modelClass () {
		return MarkerLocations;		// use this model to instantiate marker locations
	}

/*
	get updaterClass () {
		return MarkerUpdater;
	}
*/

	getRoutes () {
		return MARKER_LOCATIONS_ROUTES;
	}
}

module.exports = MarkerLocationsModule;

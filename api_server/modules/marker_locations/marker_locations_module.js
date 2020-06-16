// provide a module to handle requests associated with marker locations

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const MarkerLocations = require('./marker_locations');

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

	get modelDescription () {
		return 'Manages the locations of a set of markers associated with a particular stream at a particular commit hash';
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

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var MarkerLocations = require('./marker_locations');

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
		return 'markerLocations';
	}

	get modelName () {
		return 'markerLocations';
	}

	get modelClass () {
		return MarkerLocations;
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

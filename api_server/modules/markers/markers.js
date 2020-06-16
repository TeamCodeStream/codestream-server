// provide a module to handle requests associated with markers

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const MarkerCreator = require('./marker_creator');
const MarkerUpdater = require('./marker_updater');
const Marker = require('./marker');

// expose these restful routes
const MARKER_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'put'],
	baseRouteName: 'markers',
	requestClasses: {
		'get': require('./get_marker_request'),
		'getMany': require('./get_markers_request'),
		'put': require('./put_marker_request')
	}
};

// additional routes for this module
const MARKER_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: 'markers/:id/reference-location',
		requestClass: require('./reference_location_request')
	},
	{
		method: 'put',
		path: 'markers/:id/move',
		requestClass: require('./move_request')
	}
];

class Markers extends Restful {

	get collectionName () {
		return 'markers';	// name of the data collection
	}

	get modelName () {
		return 'marker';	// name of the data model
	}

	get creatorClass () {
		return MarkerCreator;	// use this class to instantiate markers
	}

	get modelClass () {
		return Marker;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single marker, pointing to a code block quoted in a post';
	}

	get updaterClass () {
		return MarkerUpdater;
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(MARKER_STANDARD_ROUTES);
		return [...standardRoutes, ...MARKER_ADDITIONAL_ROUTES];
	}
}

module.exports = Markers;

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var MarkerCreator = require('./marker_creator');
var Marker = require('./marker');

const MARKER_STANDARD_ROUTES = {
	want: ['getMany'],
	baseRouteName: 'markers',
	requestClasses: {
		'getMany': require('./get_markers_request')
	}
};

const MARKER_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: '/marker-locations',
		requestClass: require('./put_marker_locations_request')
	}
];

class Markers extends Restful {

	get collectionName () {
		return 'markers';
	}

	get modelName () {
		return 'marker';
	}

	get creatorClass () {
		return MarkerCreator;
	}

	get modelClass () {
		return Marker;
	}

/*
	get updaterClass () {
		return MarkerUpdater;
	}
*/

	getRoutes () {
		let standardRoutes = super.getRoutes(MARKER_STANDARD_ROUTES);
		return [...standardRoutes, ...MARKER_ADDITIONAL_ROUTES];
	}
}

module.exports = Markers;

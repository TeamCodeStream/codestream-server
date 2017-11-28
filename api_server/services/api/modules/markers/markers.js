'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var MarkerCreator = require('./marker_creator');
var Marker = require('./marker');

const MARKER_STANDARD_ROUTES = {
	want: ['getMany'],
	baseRouteName: 'markers',
	requestClasses: {
		'getMany': require('./get_markers_request'),
	}
};

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
		return super.getRoutes(MARKER_STANDARD_ROUTES);
	}
}

module.exports = Markers;

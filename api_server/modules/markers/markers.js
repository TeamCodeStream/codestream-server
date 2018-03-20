// provide a module to handle requests associated with markers

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var MarkerCreator = require('./marker_creator');
var MarkerUpdater = require('./marker_updater');
var Marker = require('./marker');

// expose these restful routes
const MARKER_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'put'],
	baseRouteName: 'markers',
	requestClasses: {
		'getMany': require('./get_markers_request'),
		'put': require('./put_marker_request')
	}
};

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

	get updaterClass () {
		return MarkerUpdater;
	}

	getRoutes () {
		return  super.getRoutes(MARKER_STANDARD_ROUTES);
	}
}

module.exports = Markers;

// provide a module to handle requests associated with streams

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var StreamCreator = require('./stream_creator');
//var StreamUpdater = require('./stream_updater');
var Stream = require('./stream');

// expose these restful routes
const STREAM_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'],
	baseRouteName: 'streams',
	requestClasses: {
		'getMany': require('./get_streams_request'),
		'post': require('./post_stream_request')
	}
};

// additional routes for this module
const STREAM_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: 'editing',
		requestClass: require('./editing_request')
	}
];

class Streams extends Restful {

	get collectionName () {
		return 'streams'; // name of the data collection
	}

	get modelName () {
		return 'stream'; // name of the data model
	}

	get creatorClass () {
		return StreamCreator; // use this class to instantiate streams
	}

	get modelClass () {
		return Stream;	// use this class for the data model
	}

	/*
	get updaterClass () {
		return StreamUpdater;	// use this class to update streams (not supported yet)
	}
	*/

	getRoutes () {
		let standardRoutes = super.getRoutes(STREAM_STANDARD_ROUTES);
		return [...standardRoutes, ...STREAM_ADDITIONAL_ROUTES];
	}
}

module.exports = Streams;

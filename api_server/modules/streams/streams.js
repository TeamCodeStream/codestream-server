// provide a module to handle requests associated with streams

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const StreamCreator = require('./stream_creator');
const StreamUpdater = require('./stream_updater');
const Stream = require('./stream');
const Errors = require('./errors');

// expose these restful routes
const STREAM_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put'],
	baseRouteName: 'streams',
	requestClasses: {
		'get': require('./get_stream_request'),
		'getMany': require('./get_streams_request'),
		'post': require('./post_stream_request'),
		'put': require('./put_stream_request')
	}
};

// additional routes for this module
const STREAM_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: 'editing',
		requestClass: require('./editing_request')
	},
	{
		method: 'put',
		path: 'join/:id',
		requestClass: require('./join_request')
	},
	{
		method: 'put',
		path: 'close/:id',
		requestClass: require('./close_request')
	},
	{
		method: 'put',
		path: 'open/:id',
		requestClass: require('./open_request')
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

	get modelDescription () {
		return 'A single stream, of type channel (named with members), direct (unnamed with members), and file (associated with a particular file in a repo)';
	}

	get updaterClass () {
		return StreamUpdater;	// use this class to update streams
	}

	getRoutes () {
		let standardRoutes = super.getRoutes(STREAM_STANDARD_ROUTES);
		return [...standardRoutes, ...STREAM_ADDITIONAL_ROUTES];
	}

	describeErrors () {
		return {
			'Streams': Errors
		};
	}
}

module.exports = Streams;

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var StreamCreator = require('./stream_creator');
//var TeamUpdater = require('./team_updater');
var Stream = require('./stream');

const STREAM_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'],
	baseRouteName: 'streams',
	requestClasses: {
		'getMany': require('./get_streams_request'),
		'post': require('./post_stream_request')
	}
};

class Streams extends Restful {

	get collectionName () {
		return 'streams';
	}

	get modelName () {
		return 'stream';
	}

	get creatorClass () {
		return StreamCreator;
	}

	get modelClass () {
		return Stream;
	}

/*
	get updaterClass () {
		return StreamUpdater;
	}
*/

	getRoutes () {
		return super.getRoutes(STREAM_STANDARD_ROUTES);
	}
}

module.exports = Streams;

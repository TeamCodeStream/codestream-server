'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var Stream_Creator = require('./stream_creator');
//var Team_Updater = require('./team_updater');
var Stream = require('./stream');

const STREAM_STANDARD_ROUTES = {
	want: ['get', 'get_many', 'post'],
	base_route_name: 'streams',
	request_classes: {
		'get_many': require('./get_streams_request')
	}
};

class Streams extends Restful {

	get collection_name () {
		return 'streams';
	}

	get model_name () {
		return 'stream';
	}

	get creator_class () {
		return Stream_Creator;
	}

	get model_class () {
		return Stream;
	}

/*
	get updater_class () {
		return Stream_Updater;
	}
*/

	get_routes () {
		return super.get_routes(STREAM_STANDARD_ROUTES);
	}
}

module.exports = Streams;

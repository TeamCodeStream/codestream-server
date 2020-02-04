// provide a module to handle requests associated with users

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const Errors = require('./errors');

// // expose these restful routes
const STANDARD_ROUTES = {
	want: ['getMany', 'post'],
	baseRouteName: 'msteams_conversations',
	requestClasses: {		
		'getMany': require('./get_msteams_conversations_request'),
		'post': require('./post_msteams_conversation_request'),
	}
}; 

class MSTeamsConversations extends Restful {

	get collectionName () {
		return 'msteams_conversations';	// name of the data collection
	}

	get modelName () {
		return 'msteams_conversation';	// name of the data model
	}

	get creatorClass () {
		return null;
	}

	get modelClass () {
		return null;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single msteams conversation';
	}

	get updaterClass () {
		return null;	// use this class to update users
	}

	get deleterClass () {
		return null;	// user this class to delete users
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(STANDARD_ROUTES);
		return standardRoutes;
	}

	initialize () {		
	}

	describeErrors () {
		return {
			'MSTeamsConversations': Errors
		};
	}
}

module.exports = MSTeamsConversations;

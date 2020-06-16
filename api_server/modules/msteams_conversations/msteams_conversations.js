// provide a module to handle requests associated with msteams_conversations

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const Errors = require('./errors');
const MSTeamsConversation = require('./msteams_conversation');

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
		// there is no way via the API to create these (they're only done internally)
		return null;
	}

	get modelClass () {
		return MSTeamsConversation;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single msteams conversation';
	}

	get updaterClass () {
		// there is no way via the API to update these (they're only done internally)
		return null;
	}

	get deleterClass () {
		// there is no way via the API to delete these (they're only done internally)
		return null;
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(STANDARD_ROUTES);
		return standardRoutes;
	}

	initialize () {	}

	describeErrors () {
		return {
			'MSTeamsConversations': Errors
		};
	}
}

module.exports = MSTeamsConversations;

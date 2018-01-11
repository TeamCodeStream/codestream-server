// secrets, never let these out beyond the server!!!

'use strict';

module.exports = {
	auth: process.env.CS_API_AUTH_SECRET,	// for authentication
	confirmationCheat: '***REMOVED***',		// for bypassing email confirmation, used for unit testing
	subscriptionCheat: '***REMOVED***',		// for allowing unregistered users to subscribe to their me-channel, for testing emails
	mail: process.env.CS_API_INBOUND_EMAIL_SECRET // used to verify requests from inbound email server
};

// secrets, never let these out beyond the server!!!

'use strict';

module.exports = {
	auth: process.env.CS_API_AUTH_SECRET,	// for authentication
	cookie: process.env.CS_API_COOKIE_SECRET,	// for cookie authentication
	confirmationCheat: process.env.CS_API_CONFIRMATION_CHEAT_CODE,	// for bypassing email confirmation, used for unit testing
	subscriptionCheat: process.env.CS_API_SUBSCRIPTION_CHEAT_CODE,	// for allowing unregistered users to subscribe to their me-channel, for testing emails
	mail: process.env.CS_API_INBOUND_EMAIL_SECRET, // used to verify requests from inbound email server
	telemetry: process.env.CS_API_PRE_AUTH_SECRET, // used to fetch the telemetry token (hard-coded into the agent, kind of blech)
	messager: process.env.CS_API_MESSAGER_SECRET	// used to communicate with the messager service
};

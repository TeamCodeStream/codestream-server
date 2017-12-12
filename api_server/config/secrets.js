// secrets, never let these out beyond the server!!!

'use strict';

module.exports = {
	auth: process.env.CS_API_AUTH_SECRET,	// for authentication
	confirmationCheat: '***REMOVED***'		// for bypassing email confirmation, used for unit testing
};

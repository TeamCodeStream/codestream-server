// secrets, never let these out beyond the server!!!

'use strict';

module.exports = {
	mailSecret: process.env.CS_MAILIN_SECRET, // for internal comms with API server
	confirmationCheat: process.env.CS_MAILIN_CONFIRMATION_CHEAT_CODE	// for bypassing email confirmation, used for unit testing
};

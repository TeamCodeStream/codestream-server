// general api server configuration

'use strict';

module.exports = {
	confirmationNotRequired: process.env.CS_API_CONFIRMATION_NOT_REQUIRED,	 // avoid the email configuration by setting this env var
	testBetaCode: 'A91C9Z'	// special beta code we use for testing
};

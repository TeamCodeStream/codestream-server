// general api server configuration

'use strict';

module.exports = {
	confirmationNotRequired: process.env.CS_API_CONFIRMATION_NOT_REQUIRED,	 // avoid the email configuration by setting this env var
	testBetaCode: 'C5R0CK'	// special beta code we use for testing
};

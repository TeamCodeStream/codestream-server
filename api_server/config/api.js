// general api server configuration

'use strict';

module.exports = {
	confirmationNotRequired: process.env.CS_API_CONFIRMATION_NOT_REQUIRED,	 // avoid the email configuration by setting this env var
	sessionAwayTimeout: process.env.CS_API_SESSION_AWAY_TIMEOUT || 10 * 60 * 1000,	// how long before we call a user "away" from keyboard
	environment: process.env.CS_ENV || 'dev'								// environment: dev, ci, pd, qa, prod
};

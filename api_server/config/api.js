// general api server configuration

'use strict';

module.exports = {
	confirmationNotRequired: process.env.CS_API_CONFIRMATION_NOT_REQUIRED,	 // avoid the email configuration by setting this env var
	sessionAwayTimeout: process.env.CS_API_SESSION_AWAY_TIMEOUT || 10 * 60 * 1000,	// how long before we call a user "away" from keyboard
	unauthenticatedPaths: ['^\\/no-auth\\/'],	// matching these paths means Authorization header is not required
	optionalAuthenticatedPaths: ['^\\/help(\\/|$)'],	// matching these paths means Authorization header is optional, behavior may vary
	helpIsAvailable: process.env.CS_API_HELP_AVAILABLE,	// if this is set, API server /help is available
	forgotPasswordExpiration: process.env.CS_API_FORGOT_PASSWORD_EXPIRATION || 24 * 60 * 60 * 1000	// how long a token for forgot-password remains valid
};

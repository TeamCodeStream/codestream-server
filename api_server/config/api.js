// general api server configuration

'use strict';

module.exports = {
	// avoid the email configuration by setting this env var
	confirmationNotRequired: process.env.CS_API_CONFIRMATION_NOT_REQUIRED,	 

	// how long before we call a user "away" from keyboard
	sessionAwayTimeout: process.env.CS_API_SESSION_AWAY_TIMEOUT || 10 * 60 * 1000,	

	// matching these paths means Authorization header is not required
	unauthenticatedPaths: ['^\\/no-auth\\/'],	

	// matching these paths means Authorization header is optional, behavior may vary
	optionalAuthenticatedPaths: ['^\\/help(\\/|$)'],
	
	// if this is set, API server /help is available
	helpIsAvailable: process.env.CS_API_HELP_AVAILABLE,	

	// how long a token for forgot-password remains valid
	forgotPasswordExpiration: process.env.CS_API_FORGOT_PASSWORD_EXPIRATION || 24 * 60 * 60 * 1000,	

	// how long a token for email confirmation remains valid
	confirmationExpiration: process.env.CS_API_CONFIRMATION_EXPIRATION || 24 * 60 * 60 * 1000,	

	// how long a confirmation code remains valid
	confirmCodeExpiration: process.env.CS_API_CONFIRM_CODE_EXPIRATION || 7 * 24 * 60 * 60 * 1000,

	// how long a signup token issued by the IDE for a user to signup on web remains valid
	signupTokenExpiration: process.env.CS_API_SIGNUP_TOKEN_EXPIRATION || 10 * 60 * 1000	
};

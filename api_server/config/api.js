// general api server configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let ApiCfg = {};
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile( {configFile: CfgFileName} );
	ApiCfg = CfgData.getSection('apiServer');
	ApiCfg.runtimeEnvironment = ApiCfg.runTimeEnvironment;
	ShowCfg = ApiCfg.showConfig;
}
else {
	ApiCfg = {
		// avoid the email configuration by setting this env var
		confirmationNotRequired: process.env.CS_API_CONFIRMATION_NOT_REQUIRED,

		// how long before we call a user "away" from keyboard
		sessionAwayTimeout: parseInt(process.env.CS_API_SESSION_AWAY_TIMEOUT || 10 * 60 * 1000, 10),	

		// if this is set, API server /help is available
		helpIsAvailable: process.env.CS_API_HELP_AVAILABLE,

		// how long a token for forgot-password remains valid
		forgotPasswordExpiration: parseInt(process.env.CS_API_FORGOT_PASSWORD_EXPIRATION || 24 * 60 * 60 * 1000, 10),	

		// how long a token for email confirmation remains valid
		confirmationExpiration: parseInt(process.env.CS_API_CONFIRMATION_EXPIRATION || 24 * 60 * 60 * 1000, 10),

		// how long a confirmation code remains valid
		confirmCodeExpiration: parseInt(process.env.CS_API_CONFIRM_CODE_EXPIRATION || 7 * 24 * 60 * 60 * 1000, 10),

		// how long a signup token issued by the IDE for a user to signup on web remains valid
		signupTokenExpiration: parseInt(process.env.CS_API_SIGNUP_TOKEN_EXPIRATION || 10 * 60 * 1000, 10),

		// environment for purposes of returning the correct asset URL for downloading the latest extension
		// (supports only vscode right now, TBD how to deal with multiple IDEs)
		assetEnvironment: process.env.CS_API_ASSET_ENV || 'prod',

		// public url to access the API server from "beyond"
		publicApiUrl: process.env.CS_API_PUBLIC_URL || 'https://api.codestream.com',

		// origin to use for third-party auth callbacks
		authOrigin: process.env.CS_API_AUTH_ORIGIN || 'https://auth.codestream.com/no-auth/prod',

		// environment, please use this configuration value sparingly, really anything that depends 
		// on environment should have its own environment variable instead
		runtimeEnvironment: process.env.CS_API_ENV || 'prod',

		// callback environment, slightly different than environment, allows for callbacks through
		// VPN to developers' local servers
		callbackEnvironment: process.env.CS_API_CALLBACK_ENV || 'prod',

		// runs in "mock mode" ... meaning nothing is saved to a database (it's all stored in memory),
		// and PubNub is replaced by IPC, for testing purposes when tests are run on the same
		// machine as the API server
		mockMode: process.env.CS_API_MOCK_MODE || false,

		// API server will not use any AWS services (on-prem mode)
		dontWantAWS: process.env.CS_API_DONT_WANT_AWS || false
	};
}

// list of third-party providers available for integrations
// this is a superset of what may actually be available in a given installation, given which
// providers represent services that are enabled by configuration of the individual modules
ApiCfg.thirdPartyProviders = [
	'asana',
	'azuredevops',
	'bitbucket',
	'github',
	'github_enterprise',
	'gitlab',
	'jira',
	'jiraserver',
	'slack',
	'trello',
	'youtrack'
];

// matching these paths means Authorization header is not required
ApiCfg.unauthenticatedPaths = ['^\\/no-auth\\/', '^\\/robots\\.txt$'];

// matching these paths means Authorization header is optional, behavior may vary
ApiCfg.optionalAuthenticatedPaths = ['^\\/help(\\/|$)', '^\\/c\\/', '^\\/p\\/', '^\\/web\\/'];

// matching these paths means cookie authentication is required
ApiCfg.cookieAuthenticatedPaths = ['^\\/c\\/', '^\\/web\\/'];

// server will use this cookie to store identity token
ApiCfg.identityCookie = 'tcs';

if (ShowCfg) console.log('Config[api]:', JSON.stringify(ApiCfg, undefined, 10));
module.exports = ApiCfg;

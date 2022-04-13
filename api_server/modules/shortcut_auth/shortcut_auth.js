// provide service to handle Azure DevOps credential authorization

'use strict';

const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');

const OAUTH_CONFIG = {
	provider: 'shortcut',
	host: 'api.app.shortcut.com/api/v3',
	apiHost: 'api.app.shortcut.com/api/v3',
	needsConfigure: true,
	hasIssues: true
};

class ShortcutAuth extends OAuthModule {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}
}

module.exports = ShortcutAuth;

const SignupTokens = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/signup_tokens');
const UUID = require('uuid').v4;
const URL = require('url');

class SigninFlowUtils {
	constructor (options) {
		Object.assign(this, options);
	}

	async insertToken (teamIds, tenantId) {
		const signupTokens = new SignupTokens({ api: this.api });
		signupTokens.initialize();
		// replace the hyphens with nothing as it makes copy/pasting easier
		const tenantToken = UUID().replace(/-/g, '');
		const result = await signupTokens.insert(tenantToken, this.user.id, {
			expiresIn: 600000,
			more: {
				teamIds: teamIds,
				tenantId: tenantId
			}
		});
		return result;
	}

	finish (finishUrl, additionalParameters, options = { request: { log: () => {}}}) {
		options.request.log('IN finish: ' + finishUrl);
		if (finishUrl) {
			try {
				// if this is a full url, aka https://example.com/foo/bar
				// this will return just the /foo/bar portion
				finishUrl = URL.parse(finishUrl).pathname;
				options.request.log('AFTER PARSE: ' + finishUrl);
				// we will get '/' if a fully qualified url is passed in...
				// change it to empty to get the default value below
				if (finishUrl === '/') {
					options.request.log('REPLACE WITH ""');
					finishUrl = '';
				}
			}
			catch (error) {
				options.request.log('CAUGHT:', error.message);
				error;
				finishUrl = '';
			}
		}
		let redirect = `${(finishUrl || '/web/finish')}?identify=true`;
		if (!additionalParameters) {
			additionalParameters = {};
		}
		if (!additionalParameters.provider) {
			additionalParameters.provider = 'CodeStream';
		}

		redirect += '&' + Object.keys(additionalParameters).map((key) => {
			return encodeURIComponent(key) + '=' + encodeURIComponent(additionalParameters[key]);
		}).join('&');

		options.request.log('FINAL REDIRECT:', redirect);
		this.response.redirect(redirect);
		return true;
	}
}

module.exports = SigninFlowUtils;
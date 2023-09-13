'use strict';

const WebRequestBase = require('./web_request_base');
const WebErrors = require('./errors');
const ProviderDisplayNames = require('./provider_display_names');

class WebProviderConnectedRequest extends WebRequestBase {

	async authorize () {}

	async process () {
		const providerName = ProviderDisplayNames[this.request.params.provider.toLowerCase()]
		if (!providerName) {
			this.warn(`Auth service ${this.provider} is not available`);
			this.response.redirect(`/web/error?code=${WebErrors.internalError.code}&provider=${this.request.params.provider}`);
			this.responseHandled = true;
			return;
		}
		return super.render('signed_in', { newRelic: false, providerName });
	}
}

module.exports = WebProviderConnectedRequest;

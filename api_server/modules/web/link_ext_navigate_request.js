'use strict';

const WebRequestBase = require('./web_request_base');
const { ides } = require('./config');

/**
 * class for handling http requests that can be sent directly into the extension
 */
class ExtensionNavigateRequest extends WebRequestBase {
	async authorize () {
		// allow anonymous users to access this
		return true;
	}

	async process () {
		await this.showNavigate();
	}

	async showNavigate () {
		const templateProps = {
			ides: ides,
			navigate: this.request.params.navigate,
			queryString: {
				q: this.request.query.q,
				ide: 'default',
				debug: this.request.query.debug === 'true'
			},
			segmentKey: this.api.config.segment.webToken
		};
		await super.render('ext_navigate', templateProps);
	}
}

module.exports = ExtensionNavigateRequest;
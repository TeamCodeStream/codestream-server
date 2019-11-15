'use strict';

const ProviderActionTest = require('./provider_action_test');
const Crypto = require('crypto');

class ImproperSignatureTest extends ProviderActionTest {

	get description () {
		return `should return an error when calling the ${this.provider} action callback with an improper signature`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	prepareData (callback) {
		super.prepareData(() => {
			const now = Date.now();
			const falseSecret = 'abcdefgijkl';
			const falseSignature = 'v0=' +
				Crypto.createHmac('sha256', falseSecret)
					.update(`v0:${now}:${this.rawBody}`, 'utf8')
					.digest('hex');
			this.apiRequestOptions.headers['x-slack-signature'] = falseSignature;
			callback();
		});
	}
}

module.exports = ImproperSignatureTest;

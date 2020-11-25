'use strict';

const ProviderInfoTest = require('./provider_info_test');

class TokenErorTest extends ProviderInfoTest {

	get description() {
		return 'can set a token error for a provider';
	}

	before(callback) {
		super.before(error => {
			if (error) { return callback(); }
			this.data.data.tokenError = {
				error: {
					message: 'oops'
				},
				occurredAt: Date.now()
			};
			this.expectedData.user.$set[`providerInfo.${this.team.id}.${this.provider}.tokenError`] = this.data.data.tokenError;
			callback();
		});
	}
}

module.exports = TokenErorTest;

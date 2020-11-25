'use strict';

const ProviderInfoTest = require('./provider_info_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AccessTokenClearsTokenErorTest extends ProviderInfoTest {

	get description() {
		return 'when setting an access token for a provider, any previous token error is cleared';
	}

	before(callback) {
		BoundAsync.series(this, [
			super.before,
			this.setTokenError,
			this.setAccessToken
		], callback);
	}

	setTokenError (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/provider-info/${this.provider}`,
				data: {
					teamId: this.team.id,
					data: {
						error: {
							message: 'oops'
						},
						occurredAt: Date.now()
					}
				},
				token: this.token
			},
			callback
		);
	}

	setAccessToken (callback) {
		this.data.data.accessToken = 'token';
		this.expectedData.user.$set[`providerInfo.${this.team.id}.${this.provider}.accessToken`] = this.data.data.accessToken;
		this.expectedData.user.$unset = {
			[`providerInfo.${this.team.id}.${this.provider}.tokenError`]: true
		};
		this.expectedData.user.$set.version++;
		this.expectedData.user.$version.before++;
		this.expectedData.user.$version.after++;
		callback();
	}
}

module.exports = AccessTokenClearsTokenErorTest;

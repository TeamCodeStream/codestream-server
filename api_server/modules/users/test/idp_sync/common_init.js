// base class for IDP Sync tests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.unifiedIdentityEnabled = true;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeMockData,		// make the mock data to be used during the request
			this.doLogin
		], callback);
	}

	setTestOptions (callback) {
		callback();
	}

	makeMockData (callback) {
		this.data = this.data || {};
		const mockUsers = this.users.map(user => {
			return {
				email: user.user.email,
				name: user.user.fullName,
				nrUserId: user.user.nrUserId
			};
		});
		this.mockHeaders = {
			'X-CS-Enable-UId': true,
			'X-CS-No-NewRelic': true,
			'X-CS-NR-Mock-Users': JSON.stringify(mockUsers),
		};
		if (this.testOrg) {
			this.mockHeaders['X-CS-NR-Mock-Org'] = JSON.stringify(this.data);
		} else {
			this.mockHeaders['X-CS-NR-Mock-User'] = JSON.stringify(this.data);
		}
		callback();
	}

	doLogin (callback) {
		if (this.delayLogin) { return callback(); }
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token: this.token,
				requestOptions: {
					headers: this.mockHeaders
				},
				testIDPSync: true
			},
			callback
		);
	}
}

module.exports = CommonInit;

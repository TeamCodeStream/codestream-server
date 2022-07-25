'use strict';

const CodeStreamMessageACLTest = require('./codestream_message_acl_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class V3TokenRevokedOnCompanyDeletedTest extends CodeStreamMessageACLTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
		this.dontObtainV3Token = true;
	}
	
	get description () {
		return 'should get an error when trying to subscribe to a user channel with a v3 token that has been revoked due to a company i am on having been deleted';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			super.makeData,
			this.createCompany,
			this.obtainToken,
			this.deleteCompany,
			this.waitForRevoke
		], callback);
	}

	createCompany (callback) {
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.createdCompany = response.company;
				callback();
			},
			{
				token: this.currentUser.accessToken
			}
		);
	}

	obtainToken (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/bcast-token',
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.currentUser.broadcasterV3Token = response.token;
				callback();
			}
		);
	}

	deleteCompany (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/companies/' + this.createdCompany.id,
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}
}

module.exports = V3TokenRevokedOnCompanyDeletedTest;

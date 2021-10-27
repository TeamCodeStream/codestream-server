// base class for inbound email tests, using "POST /no-auth/inbound-email" request

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCompanyTestGroups,
			this.makePostData		
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	// make some company test group data, as needed
	// since test group data becomes super-properties in the telemetry tracking, we use
	// this to make sure the appropriate super-properties are set
	makeCompanyTestGroups (callback) {
		if (!this.makeTestGroupData) { return callback(); }
		this.testGroupData = {
			'testGroup1': 'A',
			'testGroup2': 'B'
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/company-test-group/' + this.company.id,
				token: this.currentUser.accessToken,
				data: this.testGroupData
			},
			callback
		);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		const toEmail = `${this.teamStream.id}.${this.team.id}@${this.apiConfig.email.replyToDomain}`;
		this.data = {
			to: [{ address: toEmail }],
			from: { address: this.users[1].user.email },
			text: this.postFactory.randomText(),
			mailFile: 'somefile',	// doesn't really matter
			secret: this.apiConfig.sharedSecrets.mail,
			attachments: []
		};
		callback();
	}
}

module.exports = CommonInit;

// base class for inbound email tests, using "POST /no-auth/inbound-email" request

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const Secrets = require(process.env.CS_API_TOP + '/config/secrets');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostData		
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.type || 'channel';
		if (this.isTeamStream) {
			this.streamOptions.isTeamStream = true;
		}
		if (this.makePublic) {
			this.streamOptions.privacy = 'public';
		}
		if (this.type === 'file') {
			this.repoOptions.creatorIndex = 1;
		}
		callback();
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		const toEmail = `${this.stream._id}.${this.team._id}@${EmailConfig.replyToDomain}`;
		this.data = {
			to: [{ address: toEmail }],
			from: { address: this.users[1].user.email },
			text: this.postFactory.randomText(),
			mailFile: 'somefile',	// doesn't really matter
			secret: Secrets.mail,
			attachments: []
		};
		callback();
	}
}

module.exports = CommonInit;

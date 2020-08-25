// base class for inbound email tests, using "POST /no-auth/inbound-email" request

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

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
		const toEmail = `${this.stream.id}.${this.team.id}@${this.apiConfig.email.replyToDomain}`;
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

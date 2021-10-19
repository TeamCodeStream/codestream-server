'use strict';

const CodeErrorReplyToReplyTest = require('./code_error_reply_to_reply_test');
const CodemarkValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/test/codemark_validator');

class CodeErrorReplyToReplyWithCodemarkTest extends CodeErrorReplyToReplyTest {

	get description () {
		return 'should be ok to reply to a reply to a code error with a codemark';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark = this.codemarkFactory.getRandomCodemarkData({ wantMarkers: 2, fileStreamId: this.repoStreams[0].id });
			this.data.teamId = this.team.id;
			this.expectedTeamId = this.team.id;
			this.noExpectedTeamId = false;
			this.expectStreamMarkers = 2;
			this.expectMarkers = 2;
			this.streamUpdatesOk = true;
			callback();
		})
	}

	validateResponse (data) {
		const inputCodemark = Object.assign(this.data.codemark, {
			streamId: this.postData[0].codeError.streamId,
			postId: data.post.id
		});
		new CodemarkValidator({
			test: this,
			inputCodemark,
			usingCodeStreamChannels: true
		}).validateCodemark(data);

		super.validateResponse(data);
	}
}

module.exports = CodeErrorReplyToReplyWithCodemarkTest;

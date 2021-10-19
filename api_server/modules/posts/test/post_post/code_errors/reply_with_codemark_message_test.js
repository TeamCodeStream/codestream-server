'use strict';

const CodeErrorReplyMessageToObjectStreamTest = require('./code_error_reply_message_to_object_stream_test');
const Assert = require('assert');

class ReplyWithCodemarkMessageTest extends CodeErrorReplyMessageToObjectStreamTest {

	get description () {
		return 'when a reply to a code error is posted with a codemark, users should receive the codemark on the object channel for the code error';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark = this.codemarkFactory.getRandomCodemarkData({ wantMarkers: 2, fileStreamId: this.repoStreams[0].id});
			this.data.teamId = this.team.id;
			callback();
		})
	}

	validateMessage (message) {
		// ignore the post update message ... this should probably not be published separately anyway, but TODO
		if (message.message.post && message.message.post.$set) { return false; }
		Assert(message.message.codemark, 'no codemark');
		return super.validateMessage(message);
	}
}

module.exports = ReplyWithCodemarkMessageTest;

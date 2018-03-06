'use strict';

const SlackOutTest = require('./slack_out_test');

class ReplyTest extends SlackOutTest {

	constructor (options) {
		super(options);
		this.wantParentPost = true;
	}

	get description () {
		return 'should pass the parent post in message to slack-bot when the post is a reply';
	}
}

module.exports = ReplyTest;

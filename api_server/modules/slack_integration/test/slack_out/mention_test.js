'use strict';

const SlackOutTest = require('./slack_out_test');

class MentionTest extends SlackOutTest {

	constructor (options) {
		super(options);
		this.wantMention = true;
	}

	get description () {
		return 'should pass mentioned users in message to slack-bot when there is a mention in the post';
	}
}

module.exports = MentionTest;

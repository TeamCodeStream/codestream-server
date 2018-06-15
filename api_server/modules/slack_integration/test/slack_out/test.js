// handle unit tests for outgoing slack integration messages

'use strict';

const SlackOutTest = require('./slack_out_test');
const NoSlackOutTest = require('./no_slack_out_test');
const CodeBlockTest = require('./code_block_test');
const MentionTest = require('./mention_test');
const ReplyTest = require('./reply_test');

class SlackOutTester {

	test () {
		new SlackOutTest({ streamType: 'file' }).test();
		new SlackOutTest({ streamType: 'channel', privacy: 'public' }).test();
		new SlackOutTest({ streamType: 'channel', isTeamStream: true }).test();
		new NoSlackOutTest({ streamType: 'channel', privacy: 'private' }).test();
		new NoSlackOutTest({ streamType: 'direct' }).test();
		new CodeBlockTest().test();
		new MentionTest().test();
		new ReplyTest().test();
	}
}

module.exports = new SlackOutTester();

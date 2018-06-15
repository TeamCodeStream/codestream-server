// handle unit tests for outgoing MS Teams integration messages

'use strict';

const TeamsOutTest = require('./teams_out_test');
const NoTeamsOutTest = require('./no_teams_out_test');
const CodeBlockTest = require('./code_block_test');
const MentionTest = require('./mention_test');
const ReplyTest = require('./reply_test');

class TeamsOutTester {

	test () {
		new TeamsOutTest({ streamType: 'file' }).test();
		new TeamsOutTest({ streamType: 'channel', privacy: 'public' }).test();
		new TeamsOutTest({ streamType: 'channel', isTeamStream: true }).test();
		new NoTeamsOutTest({ streamType: 'channel', privacy: 'private' }).test();
		new NoTeamsOutTest({ streamType: 'direct' }).test();
		new CodeBlockTest().test();
		new MentionTest().test();
		new ReplyTest().test();
	}
}

module.exports = new TeamsOutTester();

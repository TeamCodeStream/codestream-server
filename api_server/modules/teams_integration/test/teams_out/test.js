// handle unit tests for outgoing MS Teams integration messages

'use strict';

const TeamsOutTest = require('./teams_out_test');
const CodeBlockTest = require('./code_block_test');
const MentionTest = require('./mention_test');
const ReplyTest = require('./reply_test');

class TeamsOutTester {

	test () {
		new TeamsOutTest().test();
		new CodeBlockTest().test();
		new MentionTest().test();
		new ReplyTest().test();
	}
}

module.exports = new TeamsOutTester();

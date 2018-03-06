'use strict';

const SlackOutTest = require('./slack_out_test');

class CodeBlockTest extends SlackOutTest {

	constructor (options) {
		super(options);
		this.wantCodeBlock = true;
	}

	get description () {
		return 'should pass code block in message to slack-bot when there is a code block in the post';
	}
}

module.exports = CodeBlockTest;

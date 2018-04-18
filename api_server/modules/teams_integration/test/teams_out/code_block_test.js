'use strict';

const TeamsOutTest = require('./teams_out_test');

class CodeBlockTest extends TeamsOutTest {

	constructor (options) {
		super(options);
		this.wantCodeBlock = true;
	}

	get description () {
		return 'should pass code block in message to MS Teams bot when there is a code block in the post';
	}
}

module.exports = CodeBlockTest;

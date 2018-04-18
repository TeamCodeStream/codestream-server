'use strict';

const TeamsOutTest = require('./teams_out_test');

class ReplyTest extends TeamsOutTest {

	constructor (options) {
		super(options);
		this.wantParentPost = true;
	}

	get description () {
		return 'should pass the parent post in message to MS Teams bot when the post is a reply';
	}
}

module.exports = ReplyTest;

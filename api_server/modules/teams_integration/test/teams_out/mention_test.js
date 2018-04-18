'use strict';

const TeamsOutTest = require('./teams_out_test');

class MentionTest extends TeamsOutTest {

	constructor (options) {
		super(options);
		this.wantMention = true;
	}

	get description () {
		return 'should pass mentioned users in message to MS Teams bot when there is a mention in the post';
	}
}

module.exports = MentionTest;

'use strict';

const PutPostTest = require('./put_post_test');

class MentionTest extends PutPostTest {

	constructor (options) {
		super(options);
		this.wantMention = true;
	}

	get description () {
		return 'should return the updated post with mentioned user array when updating a post with a mentioned user';
	}
}

module.exports = MentionTest;

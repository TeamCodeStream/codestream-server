'use strict';

const PutPostTest = require('./put_post_test');

class SharedToTest extends PutPostTest {

	constructor (options) {
		super(options);
		this.wantSharedTo = true;
	}

	get description () {
		return 'should return the updated post with sharedTo array when updating a post with sharedTo info, indicating this post has been shared to other providers';
	}
}

module.exports = SharedToTest;

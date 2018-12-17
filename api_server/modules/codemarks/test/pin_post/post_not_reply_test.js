'use strict';

const PinPostTest = require('./pin_post_test');

class PostNotReplyTest extends PinPostTest {

	constructor (options) {
		super(options);
		this.noReply = true;
	}

	get description () {
		return 'should return an error when trying to pin a post to a codemark but the post isn\'t a reply';
	}

	getExpectedError () {
		return {
			code: 'CMRK-1000'
		};
	}
}

module.exports = PostNotReplyTest;

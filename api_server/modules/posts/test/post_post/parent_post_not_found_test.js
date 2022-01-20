'use strict';

const PostReplyTest = require('./post_reply_test');
const ObjectId = require('mongodb').ObjectId;

class ParentPostNotFoundTest extends PostReplyTest {

	get description () {
		return 'should return an error when trying to reply to a post that does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'parent post'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.parentPostId = ObjectId();
			callback();
		});
	}
}

module.exports = ParentPostNotFoundTest;

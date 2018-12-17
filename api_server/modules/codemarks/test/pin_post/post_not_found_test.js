'use strict';

const PinPostTest = require('./pin_post_test');
const ObjectID = require('mongodb').ObjectID;

class PostNotFoundTest extends PinPostTest {

	get description () {
		return 'should return an error when trying to pin a post to a codemark but the post doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'post'
		};
	}

	makeRequestData (callback) {
		super.makeRequestData(() => {
			this.data.postId = ObjectID();
			callback();
		});
	}
}

module.exports = PostNotFoundTest;

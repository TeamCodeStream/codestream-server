'use strict';

const PostPostTest = require('./post_post_test');

class ACLStreamTest extends PostPostTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.members = [];
			callback();
		});
	}
	
	get description () {
		return 'should return an error when trying to create a post in a stream that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'not authorized for stream'
		};
	}
}

module.exports = ACLStreamTest;

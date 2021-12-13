'use strict';

const PostReplyTest = require('./post_reply_test');

class NoStreamIdReplyMatchTest extends PostReplyTest {

	get description () {
		return 'should return an error when trying to reply to a post and the stream ID does not match the stream ID of the parent post';
	}

	getExpectedError () {
		return {
			code: 'POST-1006'
		};
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			this.companyFactory.createRandomCompany((error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.streams[0].id;
				callback();
			}, { token: this.token });
		});
	}
}

module.exports = NoStreamIdReplyMatchTest;

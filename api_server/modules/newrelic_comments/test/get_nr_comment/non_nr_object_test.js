'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class NonNRObjectTest extends GetNRCommentTest {

	get description () {
		return 'should return an error when trying to fetch a post that isn\'t a child of a New Relic object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'parent is not a code error'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			super.before,
			this.createReply
		], callback);
	}

	setTestOptions (callback) {
		Object.assign(this.postOptions, {
			creatorIndex: 1
		});
		callback();
	}

	createReply (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: this.postData[0].post.streamId,
					text: RandomString.generate(100),
					parentPostId: this.postData[0].post.id
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/nr-comments/' + response.post.id;
				callback();
			}
		);
	}
}

module.exports = NonNRObjectTest;

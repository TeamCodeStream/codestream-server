'use strict';

const PutPostTest = require('./put_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class PutPostFetchTest extends PutPostTest {

	get description () {
		return 'should properly update a post when requested, checked by fetching the post';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { post: PostTestConstants.EXPECTED_POST_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updatePost	// perform the actual update
		], callback);
	}

	// perform the actual post update 
	// the actual test is reading the post and verifying it is correct
	updatePost (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/posts/' + this.post._id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Object.assign(this.expectedPost, response.post, this.data);
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.post, this.expectedPost, 'fetched post does not match');
	}
}

module.exports = PutPostFetchTest;

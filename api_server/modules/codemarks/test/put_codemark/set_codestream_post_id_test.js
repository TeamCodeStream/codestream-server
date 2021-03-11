'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class SetCodeStreamPostIdTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		return 'should return the updated codemark when updating a codemark with post ID and for a CodeStream post';
	}

	init (callback) {
		// after other test initialization, create a post, which we'll then link to in the test request
		BoundAsync.series(this, [
			super.init,
			this.createPost
		], callback);
	}

	// create a post, we'll then link the codemark to this post in the test request,
	// and expect appropriate changes in the response
	createPost (callback) {
		const token = this.otherUserCreatesPost ? this.users[1].accessToken : this.token;
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				this.data.postId = this.post.id;
				Object.assign(this.expectedData.codemark.$set, {
					postId: this.post.id,
					streamId: this.teamStream.id
				});
				this.expectedData.post = {
					id: this.post.id,
					_id: this.post.id, // DEPRECATE ME
					$set: {
						codemarkId: this.codemark.id,
						modifiedAt: Date.now(), // placeholder
						version: 2
					},
					$version: {
						before: 1,
						after: 2
					}
				};
				callback();
			},
			{
				streamId: this.teamStream.id,
				token
			}
		);
	}

	// get data to use for the postless codemark ... now that we allow postless codemarks to be created in 
	// non-third-party provider teams, we'll remove the providerType field from the default behavior
	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		delete data.providerType;
		return data;
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify modifiedAt for the post was updated, and then set it so the deepEqual works
		Assert(data.post.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
		this.expectedData.post.$set.modifiedAt = data.post.$set.modifiedAt;
		this.validateSanitized(data.post.$set, CodemarkTestConstants.UNSANITIZED_POST_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = SetCodeStreamPostIdTest;
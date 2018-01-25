// base class for many tests of the "PUT /posts" requests

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var CommonInit = require('./common_init');
const PostTestConstants = require('../post_test_constants');

class PutPostTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated post when updating a post';
	}

	get method () {
		return 'put';
	}

	getExpectedFields () {
		return { post: ['text', 'modifiedAt', 'hasBeenEdited'] };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a post with the updated text
        let post = data.post;
        Assert(post._id === this.post._id, 'returned post ID is not the same');
        Assert.equal(post.text, this.data.text, 'text does not match');
        Assert(post.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the post was edited');
        Assert(post.hasBeenEdited, 'hasBeenEdited flag not set');
        if (this.wantMention) {
        	Assert.deepEqual(post.mentionedUserIds, this.data.mentionedUserIds, 'mentionedUserIds is not correct');
        }
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutPostTest;

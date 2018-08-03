'use strict';

const DeletePostTest = require('./delete_post_test');
const Assert = require('assert');

class DeleteReplyToCodeBlockTest extends DeletePostTest {

	constructor (options) {
		super(options);
		this.wantParentPost = true;
	}

	get description () {
		return 'should decrement numComments for the marker when a reply to a code block post is deleted';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.markers[0]._id === this.parentPost.codeBlocks[0].markerId, 'did not get expected marker');
		Assert(data.markers[0].$inc.numComments === -1, 'numComments for marker not set to 0');
		super.validateResponse(data);
	}
}

module.exports = DeleteReplyToCodeBlockTest;

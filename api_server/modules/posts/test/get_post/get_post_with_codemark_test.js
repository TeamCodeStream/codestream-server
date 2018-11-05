'use strict';

const GetPostTest = require('./get_post_test');
const PostTestConstants = require('../post_test_constants');

class GetPostWithCodeMarkTest extends GetPostTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeMark = true;
	}

	get description () {
		return 'should return a valid post with an codemark when requesting a post created with an attached codemark';
	}

	// vdlidate the response to the request
	validateResponse (data) {
		const codemark = data.codemark;
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post.codemarkId, codemark, 'codemark');
		this.validateSanitized(codemark, PostTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetPostWithCodeMarkTest;

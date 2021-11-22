'use strict';

const GetPostTest = require('./get_post_test');
const CodeErrorTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/test/code_error_test_constants');

class GetPostWithCodeErrorTest extends GetPostTest {

	constructor (options) {
		super(options);
		Object.assign(this.postOptions, {
			wantCodeError: true,
			creatorIndex: 0
		});
	}

	get description () {
		return 'should return a valid post with a code error when requesting a post created with an attached code error';
	}

	// get the fields expected to be returned by the request being tested
	getExpectedFields () {
		// no teamId in code error posts
		const expectedFields = [...(super.getExpectedFields().post)];
		const idx = expectedFields.findIndex(field => field === 'teamId'); 
		expectedFields.splice(idx, 1);
		return { post: expectedFields };
	}
	
	// vdlidate the response to the request
	validateResponse (data) {
		const codeError = data.codeError;
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post.codeErrorId, codeError, 'code error');
		this.validateSanitized(codeError, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetPostWithCodeErrorTest;

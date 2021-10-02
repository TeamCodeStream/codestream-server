'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeErrorTestConstants = require('../code_error_test_constants');
const PostTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/test/post_test_constants');

class GetCodeErrorTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			wantCodeError: true
		});
	}

	get description () {
		return 'should return the code error when requesting a code error';
	}

	getExpectedFields () {
		return { codeError: CodeErrorTestConstants.EXPECTED_CODE_ERROR_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for the request
		], callback);
	}

	// set the path to use for the request
	setPath (callback) {
		// try to fetch the code error
		this.codeError = this.postData[0].codeError;
		this.path = '/code-errors/' + this.codeError.id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct code error, and that we only got sanitized attributes
		this.validateMatchingObject(this.codeError.id, data.codeError, 'code error');
		this.validateSanitized(data.codeError, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate we also got the parent post, with only sanitized attributes
		if (this.postData[0]) {
			this.validateMatchingObject(this.postData[0].post.id, data.post, 'post');
			this.validateSanitized(data.post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		}
	}
}

module.exports = GetCodeErrorTest;

'use strict';

const PostPostTest = require('../post_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeErrorValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/test/code_error_validator');

class CodeErrorTest extends PostPostTest {

	get description () {
		return 'should return the post with a code error when creating a post with code error info';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addCodeErrorData
		], callback);
	}

	addCodeErrorData (callback) {
		this.data.codeError = this.codeErrorFactory.getRandomCodeErrorData();
		callback();
	}

	// validate the response to the post request
	validateResponse (data) {
		// verify we got back an codemark with the attributes we specified
		const inputCodeError = Object.assign(this.data.codeError, {
			streamId: this.teamStream.id,
			postId: data.post.id
		});
		new CodeErrorValidator({
			test: this,
			inputCodeError,
			expectedOrigin: this.expectedOrigin,
			expectedOriginDetail: this.expectedOriginDetail,
		}).validateCodeError(data);
		super.validateResponse(data);
	}
}

module.exports = CodeErrorTest;

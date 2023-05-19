'use strict';

const PostPostTest = require('../post_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeErrorValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/test/code_error_validator');

class CodeErrorTest extends PostPostTest {

	get description () {
		return 'should return the post with a code error when creating a post with code error info';
	}

	makePostData (callback) {
		// allow to create code error without checking New Relic account access
		this.apiRequestOptions = this.apiRequestOptions || {};
		this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
		this.apiRequestOptions.headers['X-CS-NewRelic-Secret'] = this.apiConfig.sharedSecrets.commentEngine;

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
		this.noStreamUpdate = true;
		this.expectedStreamId = data.post.streamId; // a stream got created
		const inputCodeError = Object.assign(this.data.codeError, {
			postId: data.post.id,
			streamId: data.post.streamId
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

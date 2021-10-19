'use strict';

const PostPostTest = require('../post_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeErrorValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/test/code_error_validator');
const Assert = require('assert');

class CodeErrorTest extends PostPostTest {

	get description () {
		return 'should return the post with a code error when creating a post with code error info';
	}

	getExpectedFields () {
		const expectedFields = [...(super.getExpectedFields().post)];
		const idx = expectedFields.findIndex(field => field === 'teamId'); 
		expectedFields.splice(idx, 1);
		return { post: expectedFields };
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
		this.noStreamUpdate = true;
		this.noExpectedTeamId = true;
		this.expectedStreamId = data.post.streamId; // a stream got created
		if (this.data.streamId) {
			Assert(data.post.streamId !== this.data.streamId, 'stream ID of code error post was not ignored');
		}
		const inputCodeError = Object.assign(this.data.codeError, {
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

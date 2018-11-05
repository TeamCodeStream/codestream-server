'use strict';

const PostPostTest = require('./post_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodemarkValidator = require(process.env.CS_API_TOP + '/modules/codemarks/test/post_codemark/codemark_validator');

class CodemarkTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.expectProviderType = false;
		this.streamUpdatesOk = true;
	}

	get description () {
		return 'should return the post with an codemark when creating a post with codemark info';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addCodemarkData
		], callback);
	}

	addCodemarkData (callback) {
		this.data.codemark = this.codemarkFactory.getRandomCodemarkData();
		callback();
	}

	/* eslint complexity: 0 */
	// validate the response to the post request
	validateResponse (data) {
		// validate that we got an codemark in the response
		// verify we got back an codemark with the attributes we specified
		const inputCodemark = Object.assign(this.data.codemark, {
			streamId: this.stream._id,
			postId: data.post._id
		});
		new CodemarkValidator({
			test: this,
			inputCodemark
		}).validateCodemark(data);
		super.validateResponse(data);
	}
}

module.exports = CodemarkTest;

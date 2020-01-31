'use strict';

const PostPostTest = require('../post_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodemarkValidator = require(process.env.CS_API_TOP + '/modules/codemarks/test/codemark_validator');

class CodemarkTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.expectProviderType = false;
		this.streamUpdatesOk = true;
	}

	get description () {
		return 'should return the post with a codemark when creating a post with codemark info';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addCodemarkData
		], callback);
	}

	addCodemarkData (callback) {
		this.data.codemark = this.codemarkFactory.getRandomCodemarkData({ codemarkType: this.codemarkType || 'comment' });
		if (this.codemarkType === 'link') {
			delete this.data.codemark.text;
			delete this.data.codemark.title;
		}
		callback();
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that we got an codemark in the response
		// verify we got back an codemark with the attributes we specified
		const inputCodemark = Object.assign(this.data.codemark, {
			streamId: this.stream.id,
			postId: data.post.id
		});
		new CodemarkValidator({
			test: this,
			inputCodemark,
			expectedOrigin: this.expectedOrigin,
			usingCodeStreamChannels: true
		}).validateCodemark(data);
		super.validateResponse(data);
	}
}

module.exports = CodemarkTest;

'use strict';

const PostPostTest = require('./post_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeMarkValidator = require(process.env.CS_API_TOP + '/modules/codemarks/test/post_codemark/codemark_validator');

class CodeMarkTest extends PostPostTest {

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
			this.addCodeMarkData
		], callback);
	}

	addCodeMarkData (callback) {
		this.data.codemark = this.codemarkFactory.getRandomCodeMarkData();
		callback();
	}

	/* eslint complexity: 0 */
	// validate the response to the post request
	validateResponse (data) {
		// validate that we got an codemark in the response
		// verify we got back an codemark with the attributes we specified
		const inputCodeMark = Object.assign(this.data.codemark, {
			streamId: this.stream._id,
			postId: data.post._id
		});
		new CodeMarkValidator({
			test: this,
			inputCodeMark
		}).validateCodeMark(data);
		super.validateResponse(data);
	}
}

module.exports = CodeMarkTest;

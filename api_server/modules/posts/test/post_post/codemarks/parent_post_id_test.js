'use strict';

const CodemarkTest = require('./codemark_test');
const Assert = require('assert');

class ParentPostIdTest extends CodemarkTest {

	// for reply
	constructor (options) {
		super(options);
		this.expectedSeqNum = 2;	// two posts in the stream, overrides the default of 1
		this.expectedVersion = 3;	// stream update will get a version bump
	}

	get description () {
		return 'when replying with a post with a codemark, the codemark should inherit the parentPostId of the post';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				numPosts: 1
			});
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.parentPostId = this.postData[0].post.id;
			callback();
		});
	}

	/* eslint complexity: 0 */
	// validate the response to the post request
	validateResponse (data) {
		Assert.equal(data.codemark.parentPostId, this.data.parentPostId, 'codemark\'s parentPostId not set to parentPostId of post');
		super.validateResponse(data);
	}
}

module.exports = ParentPostIdTest;

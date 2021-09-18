'use strict';

const CodeErrorTest = require('./code_error_test');

class NoReplyWithCodeErrorTest extends CodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.numPosts = 1;
		this.postOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error if a reply is sent with code error info';
	}

	getExpectedError () {
		return {
			code: 'POST-1005'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.parentPostId = this.postData[0].post.id;
			callback();
		});
	}
}

module.exports = NoReplyWithCodeErrorTest;

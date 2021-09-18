'use strict';

const CodeErrorTest = require('./code_error_test');

class NoCodeErrorAndCodemarkTest extends CodeErrorTest {

	get description () {
		return 'should return an error if a post is sent with both codemark and code error info';
	}

	getExpectedError () {
		return {
			code: 'POST-1004'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark = this.codemarkFactory.getRandomCodemarkData();
			callback();
		});
	}
}

module.exports = NoCodeErrorAndCodemarkTest;

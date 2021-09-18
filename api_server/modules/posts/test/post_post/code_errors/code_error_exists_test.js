'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');

class CodeErrorExistsTest extends CodeErrorTest {

	get description () {
		return 'when creating a code error with identical object ID and object type, and identical stack trace, the existing code error should be returned';
	}

	setTestOptions (callback) {
		this.noStreamUpdate = true;
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodeError: true
			});
			callback();
		});
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// we'll use the pre-existing code error instead of generating one randomly
			const existingCodeError = this.postData[0].codeError;
			Object.assign(this.data.codeError, {
				objectId: existingCodeError.objectId,
				objectType: existingCodeError.objectType,
				stackTraces: existingCodeError.stackTraces
			});
			this.data.text = this.postData[0].post.text; // this is to suppress error complaining about the post text not getting updated, a non-real scenario
			callback();
		});
	}

	validateResponse (data) {
		if (this.codeErrorInDifferentTeam) {
			Assert.notEqual(data.codeError.id, this.postData[0].codeError.id, 'returned code error was the same as the existing code error');
		} else {
			Assert.equal(data.codeError.id, this.postData[0].codeError.id, 'returned code error was not the same as the existing code error');
		}
		super.validateResponse(data);
	}
}

module.exports = CodeErrorExistsTest;

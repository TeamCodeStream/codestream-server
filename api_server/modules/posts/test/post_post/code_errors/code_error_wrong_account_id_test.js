'use strict';

const CodeErrorExistsTest = require('./code_error_exists_test');

class CodeErrorWrongAccountIdTest extends CodeErrorExistsTest {

	get description () {
		return 'should return an error when creating a code error with identical object ID and object type, but not the same account ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'found existing object but account ID does not match'
		};
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		// replace the team and stream ID of the post we are going to create with those of hte other team
		super.makePostData(() => {
			this.data.codeError.accountId = this.codeErrorFactory.randomAccountId();
			callback();
		});
	}
}

module.exports = CodeErrorWrongAccountIdTest;
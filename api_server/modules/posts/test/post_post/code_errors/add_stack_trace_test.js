'use strict';

const CodeErrorExistsTest = require('./code_error_exists_test');

class AddStackTraceTest extends CodeErrorExistsTest {

	get description () {
		return 'when creating a code error with identical object ID and object type, and different stack trace, the existing code error should be returned, with the stack trace added';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// replace the stackTrace with a different one
			this.expectedStackTraces = [
				...this.data.codeError.stackTraces
			];
			const newStackTraceInfo = this.codeErrorFactory.getRandomStackTraceInfo();
			this.data.codeError.stackTraces = [newStackTraceInfo];
			this.expectedStackTraces.push(newStackTraceInfo);
			callback();
		});
	}
}

module.exports = AddStackTraceTest;

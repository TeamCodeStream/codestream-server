'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');

class CodeErrorEntryPointTest extends CodeErrorTest {

	get description () {
		return 'should be able to provide an entry point when creating a code error';
	}

	addCodeErrorData (callback) {
		super.addCodeErrorData(error => {
			if (error) { return callback(error); }
			this.data.codeError.entryPoint = `TEST ${this.testNum}`;
			callback();
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data.codeError.entryPoint, `TEST ${this.testNum}`, 'entryPoint attribute not set');
		super.validateResponse(data);
	}
}

module.exports = CodeErrorEntryPointTest;

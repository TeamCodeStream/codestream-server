'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const ObjectId = require('mongodb').ObjectId;

class CodeErrorNotFoundTest extends DeleteCodeErrorTest {

	get description () {
		return 'should return an error when trying to delete a code error that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'code error'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/code-errors/' + ObjectId(); // substitute an ID for a non-existent code error
			callback();
		});
	}
}

module.exports = CodeErrorNotFoundTest;

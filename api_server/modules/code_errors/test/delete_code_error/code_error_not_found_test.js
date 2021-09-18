'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const ObjectID = require('mongodb').ObjectID;

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
			this.path = '/code-errors/' + ObjectID(); // substitute an ID for a non-existent code error
			callback();
		});
	}
}

module.exports = CodeErrorNotFoundTest;

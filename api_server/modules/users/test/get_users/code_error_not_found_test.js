'use strict';

const GetCodeErrorFollowersTest = require('./get_code_error_followers_test');
const ObjectID = require('mongodb').ObjectID;

class CodeErrorNotFoundTest extends GetCodeErrorFollowersTest {

	get description () {
		return 'should return an error if a request is made to fetch the users for a non-existent code error';
	}

	setPath (callback) {
		this.path = '/users?codeErrorId=' + ObjectID();
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'code error'
		};
	}
}

module.exports = CodeErrorNotFoundTest;

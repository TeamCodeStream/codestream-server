'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');

class ACLTest extends GetCodeErrorsTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch code errors from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTest;

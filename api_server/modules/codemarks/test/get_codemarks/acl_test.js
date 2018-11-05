'use strict';

const GetCodemarksTest = require('./get_codemarks_test');

class ACLTest extends GetCodemarksTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch codemarks from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'	// readAuth
		};
	}
}

module.exports = ACLTest;

'use strict';

const GetCodeErrorTest = require('./get_code_error_test');

class ACLTeamTest extends GetCodeErrorTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
		this.teamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch a code error from a ${this.type} stream from a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTeamTest;

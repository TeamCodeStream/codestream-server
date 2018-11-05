'use strict';

const GetCodemarkTest = require('./get_codemark_test');

class ACLTeamTest extends GetCodemarkTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
		this.teamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch an codemark from a ${this.type} stream from a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTeamTest;

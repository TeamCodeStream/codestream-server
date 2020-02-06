'use strict';

const GetChangesetTest = require('./get_changeset_test');

class ACLTeamTest extends GetChangesetTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
		this.teamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch a changeset from a ${this.type} stream from a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTeamTest;

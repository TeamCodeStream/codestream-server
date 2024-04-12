'use strict';

const GetEntitiesTest = require('./get_entities_test');

class ACLTest extends GetEntitiesTest {

	constructor (options) {
		super(options);
		this.currentUserNotOnTeam = true;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch entities from a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTest;

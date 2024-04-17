'use strict';

const GetEntityTest = require('./get_entity_test');

class ACLTest extends GetEntityTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
		this.teamCreatorCreatesEntity = true;
	}

	get description () {
		return 'should return an error when trying to fetch a New Relic entity from a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTest;

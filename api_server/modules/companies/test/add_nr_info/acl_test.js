'use strict';

const AddNRInfoTest = require('./add_nr_info_test');

class ACLTest extends AddNRInfoTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when attempting to set New Relic account/org info for a company i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;

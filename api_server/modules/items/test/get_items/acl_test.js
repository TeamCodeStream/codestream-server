'use strict';

const GetItemsTest = require('./get_items_test');

class ACLTest extends GetItemsTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch items from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'	// readAuth
		};
	}
}

module.exports = ACLTest;

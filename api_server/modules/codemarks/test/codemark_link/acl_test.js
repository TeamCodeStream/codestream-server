'use strict';

const CodemarkLinkTest = require('./codemark_link_test');

class ACLTest extends CodemarkLinkTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when attempting to create a codemark link for a codemark owned by a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTest;

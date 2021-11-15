'use strict';

const GetPostTest = require('./get_post_test');

class ACLTest extends GetPostTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch a post from the team stream from a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTest;

'use strict';

const GetLinkCodemarkTest = require('./get_link_codemark_test');

class LinkCodemarkACLTest extends GetLinkCodemarkTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch a link-type codemark from a team that the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = LinkCodemarkACLTest;

'use strict';

const GetPostlessCodeMarkTest = require('./get_postless_codemark_test');

class PostlessACLTest extends GetPostlessCodeMarkTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch a postless codemark from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = PostlessACLTest;

'use strict';

const GetPostlessItemTest = require('./get_postless_item_test');

class PostlessACLTest extends GetPostlessItemTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch a postless item from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = PostlessACLTest;

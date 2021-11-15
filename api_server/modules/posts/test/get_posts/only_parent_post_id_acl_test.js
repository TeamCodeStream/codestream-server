'use strict';

const OnlyParentPostIdOkTest = require('./only_parent_post_id_ok_test');

class OnlyParentPostIdAclTest extends OnlyParentPostIdOkTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'when fetching child posts of a parent post and only passing the parent post ID, an error should be returned if the user is not on the team that owns the post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = OnlyParentPostIdAclTest;

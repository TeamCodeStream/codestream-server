'use strict';

const GetRepliesToCodeErrorByParentPostIdTest = require('./get_replies_to_code_error_by_parent_post_id_test');

class TeamIdIgnoredForRepliesToCodeErrorTest extends GetRepliesToCodeErrorByParentPostIdTest {

	get description () {
		return 'should ignore requests with teamId, when fetching replies to a code error by parent post';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		super.setPath(() => {
			this.path += `&teamId=${this.team.id}`;
			callback();
		});
	}
}

module.exports = TeamIdIgnoredForRepliesToCodeErrorTest;

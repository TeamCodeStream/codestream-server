'use strict';

const ForeignMembersTest = require('./foreign_members_test');

class ForeginMemberAssignerTest extends ForeignMembersTest {

	constructor (options) {
		super(options);
		this.expectedUsers = ['creator'];
	}

	get description () {
		return 'when a user is assigned to a New Relic object that is already owned by a team, the assigner should be added as a foreign member of the team unless they are already on the team';
	}

	makeNRRequestData (callback) {
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			// make the assignee a user who is already on the team, so only the assigner becomes a foreign member
			this.data.assignee.email = this.users[0].user.email;
			callback();
		});
	}
}

module.exports = ForeginMemberAssignerTest;

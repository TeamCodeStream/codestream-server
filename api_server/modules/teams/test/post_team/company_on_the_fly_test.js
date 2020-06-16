'use strict';

const PostTeamTest = require('./post_team_test');

class CompanyOnTheFlyTest extends PostTeamTest {

	get description () {
		return 'when creating a team, should also be able to create a company on the fly';
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a team, but then add company attributes
		super.before(error => {
			if (error) { return callback(error); }
			this.data.company = { 
				name: this.companyFactory.randomName()
			};
			callback();
		});
	}
}

module.exports = CompanyOnTheFlyTest;

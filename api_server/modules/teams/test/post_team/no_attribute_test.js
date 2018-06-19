'use strict';

var PostTeamTest = require('./post_team_test');

class NoAttributeTest extends PostTeamTest {

	get description () {
		return `should return an error when attempting to create a team with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a team, but...
		super.before(error => {
			if (error) { return callback(error); }
			// ...delete the attribute of interest
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;

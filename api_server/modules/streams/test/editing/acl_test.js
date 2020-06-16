'use strict';

const EditingTest = require('./editing_test');

class ACLTest extends EditingTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;
	}

	get description () {
		return 'should return an error when trying to set editing for a file in a team i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.teamOptions, {
				creatorIndex: 1,
				members: []
			});
			callback();
		});
	}
}

module.exports = ACLTest;

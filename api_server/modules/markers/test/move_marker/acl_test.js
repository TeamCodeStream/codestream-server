'use strict';

const MoveTest = require('./move_test');

class ACLTest extends MoveTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to move the location for a marker';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTest;

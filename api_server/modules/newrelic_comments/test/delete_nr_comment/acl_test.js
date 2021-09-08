'use strict';

const DeleteMarkerTest = require('./delete_marker_test');

class ACLTest extends DeleteMarkerTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.members = [2];
		this.teamCreatorCreatesCodemark = true;
	}

	get description () {
		return 'should return an error when trying to delete a marker from a codemark on a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013'
		};
	}
}

module.exports = ACLTest;

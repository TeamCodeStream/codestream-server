'use strict';

const AddMarkersTest = require('./add_markers_test');

class ACLTest extends AddMarkersTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.members = [2];
		this.teamCreatorCreatesCodemark = true;
	}

	get description () {
		return 'should return an error when trying to add markers to a codemark on a team the current user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;

'use strict';

const AddMarkersTest = require('./add_markers_test');

class ACLCreatorTest extends AddMarkersTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.otherUserCreatesCodemark = true;
	}

	get description () {
		return 'should return an error when a user tries to add markers to a codemark they did not create, if they are not an admin';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLCreatorTest;

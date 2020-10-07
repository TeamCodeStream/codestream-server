'use strict';

const AddMarkersTest = require('./add_markers_test');

class AdminCanAddTest extends AddMarkersTest {

	constructor(options) {
		super(options);
		this.teamCreatorIndex = 0;
		this.userOptions.numRegistered = 3;
		this.otherUserCreatesCodemark = true;
	}

	get description() {
		return 'admin should be able to add markers to a codemark they did not create';
	}
}

module.exports = AdminCanAddTest;

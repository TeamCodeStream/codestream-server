'use strict';

const DeleteMarkerTest = require('./delete_marker_test');

class AdminCanDeleteTest extends DeleteMarkerTest {

	constructor(options) {
		super(options);
		this.teamCreatorIndex = 0;
		this.userOptions.numRegistered = 3;
		this.otherUserCreatesCodemark = true;
	}

	get description() {
		return 'admin should be able to delete a marker from a codemark they did not create';
	}
}

module.exports = AdminCanDeleteTest;

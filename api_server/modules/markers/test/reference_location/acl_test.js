'use strict';

const ReferenceLocationTest = require('./reference_location_test');

class ACLTest extends ReferenceLocationTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to add a reference location for a marker';
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

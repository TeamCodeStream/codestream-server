'use strict';

const PutMarkerTest = require('./put_marker_test');

class ACLTest extends PutMarkerTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to update a marker';
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

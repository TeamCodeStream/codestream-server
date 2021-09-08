'use strict';

const GetMarkerTest = require('./get_marker_test');

class ACLTest extends GetMarkerTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch a marker from a stream owned by a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	 // readAuth
		};
	}
}

module.exports = ACLTest;

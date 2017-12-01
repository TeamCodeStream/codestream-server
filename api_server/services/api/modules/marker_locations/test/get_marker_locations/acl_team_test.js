'use strict';

var GetMarkerLocationsTest = require('./get_marker_locations_test');

class ACLTeamTest extends GetMarkerLocationsTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;
	}

	get description () {
		return 'should return an error when trying to fetch marker locations from a stream in a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTeamTest;

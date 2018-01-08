'use strict';

var GetMarkerTest = require('./get_marker_test');

class ACLTest extends GetMarkerTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;	 // create a team without me
	}

	get description () {
		return `should return an error when trying to fetch a marker from a stream owned by a team that i\'m not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	 // readAuth
		};
	}

	// set path to use for the request
	setPath (callback) {
		// this should fail since i'm not a member of the team
		this.path = '/markers/' + this.marker._id;
		callback();
	}
}

module.exports = ACLTest;

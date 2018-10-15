'use strict';

const EditingTest = require('./editing_test');
const Assert = require('assert');

class NoMatchTeamTest extends EditingTest {

	constructor (options) {
		super(options);
		this.wantForeignTeam = true;
	}

	get description () {
		return 'should return an empty response when user indicated editing a file for a stream but the teamId doesn\'t match the teamId of the stream';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// form the data to be used in the test request
	makeEditingData (callback) {
		// make the usual data but use the teamid for the second team created
		super.makeEditingData(() => {
			this.data.teamId = this.foreignTeam._id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, { streams: [] }, 'expected empty streams');
	}
}

module.exports = NoMatchTeamTest;

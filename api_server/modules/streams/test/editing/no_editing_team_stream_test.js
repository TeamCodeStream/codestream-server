'use strict';

const EditingTest = require('./editing_test');
const Assert = require('assert');

class NoEditingTeamStreamTest extends EditingTest {

	get description () {
		return `should return an empty response when trying to set editing for the team stream`;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.streamId = this.teamStream.id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, { streams: [] }, 'expected empty streams');
	}

}

module.exports = NoEditingTeamStreamTest;

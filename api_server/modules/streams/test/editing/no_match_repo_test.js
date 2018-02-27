'use strict';

const EditingTest = require('./editing_test');

class NoMatchRepoTest extends EditingTest {

	constructor (options) {
		super(options);
		this.wantSecondRepo = true;
		this.secondRepoHasSameTeamId = true;
	}

	get description () {
		return `should return an error when user indicated editing a file for a stream but the repoId doesn\'t match the repoId of the stream`;
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
			this.data.repoId = this.otherRepo._id;
			callback();
		});
	}
}

module.exports = NoMatchRepoTest;

'use strict';

const TeamLookupTest = require('./team_lookup_test');

class EmptyLookupTest extends TeamLookupTest {

	get description() {
		return 'should return an empty object when trying to lookup a team by repo specifying an unmatched commit hash';
	}

	getRequestData() {
		this.expectEmpty = true;
		const data = super.getRequestData();
		data.commitHashes = this.markerFactory.randomCommitHash();
		return data;
	}
}

module.exports = EmptyLookupTest;

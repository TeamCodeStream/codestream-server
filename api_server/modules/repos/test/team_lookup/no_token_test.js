'use strict';

const TeamLookupTest = require('./team_lookup_test');

class NoTokenTest extends TeamLookupTest {

	get description() {
		return 'no access token should be necessary when looking up teams by commit hash';
	}

	before(callback) {
		this.ignoreTokenOnRequest = true;
		super.before(callback);
	}
}

module.exports = NoTokenTest;

'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');

class NoNewCommitHashTest extends PutCalculateLocationsTest {

	constructor (options) {
		super(options);
		this.noNewCommitHash = true;
	}

	get description () {
		return 'should properly calculate and save marker locations when requested, even if no new commit hash is provided';
	}
}

module.exports = NoNewCommitHashTest;

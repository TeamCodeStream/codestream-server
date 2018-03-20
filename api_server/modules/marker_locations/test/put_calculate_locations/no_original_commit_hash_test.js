'use strict';

var ClientSendsLocationsTest = require('./client_sends_locations_test');

class NoOriginalCommitHashTest extends ClientSendsLocationsTest {

	get description () {
		return 'should properly calculate and save marker locations when requested, even if no original commit hash is provided';
	}

	// set data to be used in the request
	setData (callback) {
		// remove the originalCommitHash attribute, this should be irrelevant anyway
		super.setData(() => {
			delete this.data.originalCommitHash;
			callback();
		});
	}
}

module.exports = NoOriginalCommitHashTest;

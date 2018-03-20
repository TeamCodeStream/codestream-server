'use strict';

var ClientSendsLocationsTest = require('./client_sends_locations_test');

class NoStreamIdTest extends ClientSendsLocationsTest {

	get description () {
		return 'should properly calculate and save marker locations when requested, even if no stream ID is provided';
	}

	// set data to be used in the request
	setData (callback) {
		// remove the streamId attribute, this should be irrelevant anyway
		super.setData(() => {
			delete this.data.streamId;
			callback();
		});
	}
}

module.exports = NoStreamIdTest;

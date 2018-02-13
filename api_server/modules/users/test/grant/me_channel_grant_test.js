'use strict';

var GrantTest = require('./grant_test');

class MeChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
	}

	get description () {
		return 'should succeed when requesting to grant access to me-channel';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// set to grant access to the user's me-channel
		this.path = '/grant/user-' + this.currentUser._id;
		callback();
	}
}

module.exports = MeChannelGrantTest;

'use strict';

var GrantTest = require('./grant_test');

class MeChannelGrantTest extends GrantTest {

	constructor (options) {
		super(options);
	}

	get description () {
		return 'should succeed when requesting to grant access to me-channel';
	}

	setPath (callback) {
		this.path = '/grant/user-' + this.currentUser._id;
		callback();
	}
}

module.exports = MeChannelGrantTest;

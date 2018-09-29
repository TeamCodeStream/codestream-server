'use strict';

const ProviderConnectTest = require('./provider_connect_test');
const Assert = require('assert');

class ExistingUnregisteredUserTest extends ProviderConnectTest {

	constructor (options) {
		super(options);
		this.wantPreExistingUnconnectedUser = true;
	}

	get description () {
		return `should confirm a pre-existing unregistered user and create a team when the user connects to ${this.provider}`;
	}

	setData (callback) {
		super.setData(() => {
			// set a mock email for the user returned by the provider, to the email of the 
			// unregistered user
			this.data.providerInfo.mockEmail = this.preExistingUnconnectedUser.email;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const { user } = data;

		// ensure returned user is the same as the pre-existing user
		Assert.equal(user._id, this.preExistingUnconnectedUser._id, 'returned user does not match pre-existing user');
		super.validateResponse(data);
	} 
}

module.exports = ExistingUnregisteredUserTest;

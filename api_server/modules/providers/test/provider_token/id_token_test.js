'use strict';

const NRLoginTest = require('./nrlogin_test');

class IDTokenTest extends NRLoginTest {

	constructor (options) {
		super(options);
		this.wantIDToken = true;
	}

	get description () {
		let desc = 'should create a user and set an access token for the user when completing a New Relic authorization flow, using ID token';
		if (this.serviceGatewayEnabled) {
			desc += ', and set CodeStream access token with Service Gateway auth enabled';
		}
		return desc;
	}
}

module.exports = IDTokenTest;

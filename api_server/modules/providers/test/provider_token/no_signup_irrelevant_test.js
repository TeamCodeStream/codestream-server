'use strict';

const NRLoginTest = require('./nrlogin_test');

class NoSignupIrrelevantTest extends NRLoginTest {

	constructor (options) {
		super(options);
		this.noSignup = true;
	}

	get description () {
		let desc = 'should allow user creation on a New Relic auth flow with no matching user, even if noSignup flag is supplied (which is irrelevant to New Relic login)';
		if (this.serviceGatewayEnabled) {
			desc += ', with Service Gateway auth enabled';
		}
		return desc;
	}
}

module.exports = NoSignupIrrelevantTest;

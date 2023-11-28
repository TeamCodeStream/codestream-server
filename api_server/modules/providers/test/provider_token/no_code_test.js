'use strict';

const NRLoginTest = require('./nrlogin_test');

class NoCodeTest extends NRLoginTest {

	constructor (options) {
		super(options);
		this.wantError = 'RAPI-1001';
	}

	get description () {
		let desc = 'should redirect to an error page when completing a New Relic authorization flow and no auth code is given';
		if (this.serviceGatewayEnabled) {
			desc += ', with Service Gateway auth enabled';
		}
		return desc;
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		delete parameters.auth_code;
		return parameters;
	}
}

module.exports = NoCodeTest;

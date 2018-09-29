'use strict';

const ProviderConnectTest = require('./provider_connect_test');

class NoAttributeTest extends ProviderConnectTest {

	get description () {
		return `should return error when connecting to ${this.provider} with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// before the test runs...
	before (callback) {
		// delete the attribute in question
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;

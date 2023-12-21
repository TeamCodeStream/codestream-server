'use strict';

const NRLoginTest = require('./nrlogin_test');

class ParameterRequiredTest extends NRLoginTest {

	constructor (options) {
		super(options);
		this.wantError = true;
	}
	
	get description () {
		return `should return an error when attempting to do cross-environment NR auth with no ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	getData () {
		const data = super.getData();
		delete data[this.attribute];
		return data;
	}
}

module.exports = ParameterRequiredTest;

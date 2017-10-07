'use strict';

var Confirmation_Test = require('./confirmation_test');

class No_Attribute_Test extends Confirmation_Test {

	get_description () {
		return `should return an error when confirming a registration with no ${this.attribute}`;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	before (callback) {
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = No_Attribute_Test;

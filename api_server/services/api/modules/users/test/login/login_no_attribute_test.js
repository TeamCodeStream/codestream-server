'use strict';

var Login_Test = require('./login_test');

class Login_No_Attribute_Test extends Login_Test {

	get_description () {
		return `should return error when no ${this.attribute} provided`;
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

module.exports = Login_No_Attribute_Test;

'use strict';

var Registration_Test = require('./registration_test');

class No_Attribute_Test extends Registration_Test {

	get description () {
		return `should return error when registering with no ${this.attribute}`;
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

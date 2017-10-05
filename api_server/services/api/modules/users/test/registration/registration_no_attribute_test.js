'use strict';

var Registration_Test = require('./registration_test');

class Registration_No_Attribute_Test extends Registration_Test {

	get_description () {
		return `should return error when registering with no ${this.attribute}`;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				[this.attribute]: 'is required'
			}]
		};
	}

	before (callback) {
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = Registration_No_Attribute_Test;

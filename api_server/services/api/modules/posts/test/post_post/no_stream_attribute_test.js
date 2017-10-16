'use strict';

var Direct_On_The_Fly_Test = require('./direct_on_the_fly_test');

class No_Stream_Attribute_Test extends Direct_On_The_Fly_Test {

	get description () {
		return `should return an error when attempting to create a post and creating a direct stream on the fly with no ${this.attribte}`;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1002',
			info: this.attribute
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream[this.attribute];
			callback();
		});
	}
}

module.exports = No_Stream_Attribute_Test;

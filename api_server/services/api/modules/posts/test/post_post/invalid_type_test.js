'use strict';

var Direct_On_The_Fly_Test = require('./direct_on_the_fly_test');

class Invalid_Type_Test extends Direct_On_The_Fly_Test {

	get description () {
		return 'should return an error when attempting to create a post and creating a stream on the fly with an invalid type';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1000'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.type = 'sometype';
			callback();
		});
	}
}

module.exports = Invalid_Type_Test;

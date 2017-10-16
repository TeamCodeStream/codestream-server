'use strict';

var Channel_On_The_Fly_Test = require('./channel_on_the_fly_test');

class Name_Required_Test extends Channel_On_The_Fly_Test {

	get description () {
		return 'should return an error when attempting to create a post and creating a channel stream on the fly with no name';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1001'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.name;
			callback();
		});
	}
}

module.exports = Name_Required_Test;

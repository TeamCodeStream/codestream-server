'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class ACL_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error when trying to fetch a user not on a team that i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	before (callback) {
		this.user_factory.create_random_user((error, data) => {
			if (error) { return callback(error); }
			this.path = '/users/' + data.user._id;
			callback();
		});
	}
}

module.exports = ACL_Test;

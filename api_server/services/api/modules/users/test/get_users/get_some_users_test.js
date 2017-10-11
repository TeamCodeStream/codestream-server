'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
const User_Test_Constants = require('../user_test_constants');

class Get_Some_Users_Test extends CodeStream_API_Test {

	get description () {
		return 'should return the right users when requesting users by IDs';
	}

	before (callback) {
		this.user_factory.create_random_users(4, (error, data) => {
			if (error) { return callback(error); }
			let users = data.map(user_data => user_data.user);
			this.user_subset = [users[1], users[3]];
			let ids_subset = this.user_subset.map(user => user._id);
			this.path = '/users?ids=' + ids_subset.join(',');
			callback();
		});
	}

	validate_response (data) {
		this.validate_matching_objects(this.user_subset, data.users, 'users');
		this.validate_sanitized_objects(data.users, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Some_Users_Test;

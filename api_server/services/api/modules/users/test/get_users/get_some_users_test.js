'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var User_Test_Constants = require('../user_test_constants');

const DESCRIPTION = 'should return the right users when requesting users by IDs';

class Get_Some_Users_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	before (callback) {
		this.user_factory.create_random_users(4, (error, data) => {
			if (error) { return callback(error); }
			var users = data.map(user_data => user_data.user);
			this.user_subset = [users[1], users[3]];
			var ids_subset = this.user_subset.map(user => user._id);
			this.path = '/users?ids=' + ids_subset.join(',');
			callback();
		});
	}

	validate_response (data) {
console.warn('data', data);
		this.validate_matching_objects(this.user_subset, data.users, 'users');
		this.validate_sanitized_objects(data.users, User_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Some_Users_Test;

'use strict';

var Read_Test = require('./read_test');
const User_Test_Constants = require('../user_test_constants');

class Read_All_Test extends Read_Test {

	get description () {
		return 'should clear all of last_reads for the current user when requested';
	}

	get_expected_fields () {
		let me_fields = [...User_Test_Constants.EXPECTED_ME_FIELDS];
		let index = me_fields.indexOf('last_reads');
		if (index !== -1) {
			me_fields.splice(index);
		}
		let user_response = {};
		user_response.user = [...User_Test_Constants.EXPECTED_USER_FIELDS, ...me_fields];
		return user_response;
	}

	mark_read (callback) {
		this.do_api_request(
			{
				method: 'put',
				path: '/read/all',
				token: this.token
			},
			callback
		);
	}

	validate_response (data) {
		this.validate_sanitized(data.user);
	}
}

module.exports = Read_All_Test;

'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Company_Test_Constants = require('../company_test_constants');

class Get_Other_Company_Test extends CodeStream_API_Test {

	get description () {
		return 'should return company when requesting another company';
	}

	get_expected_fields () {
		return { company: Company_Test_Constants.EXPECTED_COMPANY_FIELDS };
	}

	before (callback) {
		this.user_factory.create_random_user((error, user) => {
			if (error) { return callback(error); }
			if (!user.companies || !user.companies[0]) { return callback('user needs an company'); }
			this.created_user = user;
			this.path = '/company/' + user.companies[0]._id;
			callback();
		});
	}

	validate_response (data) {
		return this.validate_matching_object(this.created_user.companies[0]._id, data.company, 'company');
	}
}

module.exports = Get_Other_Company_Test;

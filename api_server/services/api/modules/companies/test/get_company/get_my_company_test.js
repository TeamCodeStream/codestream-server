'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Company_Test_Constants = require('../company_test_constants');

class Get_My_Company_Test extends CodeStream_API_Test {

	get description () {
		return 'should return groups i am a member of when requesting my groups';
	}

	get_expected_fields () {
		return { company: Company_Test_Constants.EXPECTED_COMPANY_FIELDS };
	}

	before (callback) {
		this.path = '/company/' + this.current_companies[0]._id;
		callback();
	}

	validate_response (data) {
		return this.validate_matching_object(this.current_companies[0]._id, data.company, 'company');
	}
}

module.exports = Get_My_Company_Test;

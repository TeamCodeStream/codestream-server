'use strict';

var Get_Company_Test = require('./get_company_test');

class Get_My_Company_Test extends Get_Company_Test {

	get description () {
		return 'should return a valid company when requesting a company created by me';
	}

	set_path (callback) {
		this.path = '/companies/' + this.my_company._id;
		callback();
	}

	validate_response (data) {
		this.validate_matching_object(this.my_company._id, data.company, 'company');
		super.validate_response(data);
	}
}

module.exports = Get_My_Company_Test;

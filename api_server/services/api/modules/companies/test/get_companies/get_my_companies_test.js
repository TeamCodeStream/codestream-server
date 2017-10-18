'use strict';

var Get_Companies_Test = require('./get_companies_test');

class Get_My_Companies_Test extends Get_Companies_Test {

	get description () {
		return 'should return companies i am a member of when requesting my companies';
	}

	set_path (callback) {
		this.path = '/companies?mine';
		callback();
	}

	validate_response (data) {
		let my_companies = [this.my_company, ...this.other_companies];
		this.validate_matching_objects(my_companies, data.companies, 'companies');
		super.validate_response(data);
	}
}

module.exports = Get_My_Companies_Test;

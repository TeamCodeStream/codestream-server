'use strict';

var Get_Companies_Test = require('./get_companies_test');

class Get_Companies_By_Id_Test extends Get_Companies_Test {

	get description () {
		return 'should return the correct companies when requesting companies by ID';
	}

	set_path (callback) {
		this.path = `/companies?ids=${this.my_company._id},${this.other_companies[0]._id}`;
		callback();
	}

	validate_response (data) {
		let my_companies = [this.my_company, this.other_companies[0]];
		this.validate_matching_objects(my_companies, data.companies, 'companies');
		super.validate_response(data);
	}
}

module.exports = Get_Companies_By_Id_Test;

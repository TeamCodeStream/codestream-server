'use strict';

var CodeStream_Model = require(process.env.CI_API_TOP + '/lib/models/codestream_model');
var CodeStream_Model_Validator = require(process.env.CI_API_TOP + '/lib/models/codestream_model_validator');
const Company_Attributes = require('./company_attributes');

class Company extends CodeStream_Model {

	get_validator () {
		return new CodeStream_Model_Validator(Company_Attributes);
	}
}

module.exports = Company;

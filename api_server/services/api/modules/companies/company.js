// the Company model

'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const CompanyAttributes = require('./company_attributes');

class Company extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(CompanyAttributes);
	}
}

module.exports = Company;

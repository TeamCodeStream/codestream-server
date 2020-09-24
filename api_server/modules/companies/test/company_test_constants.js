// test constants for testing the companies module

'use strict';

const CompanyAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/company_attributes');

const EXPECTED_COMPANY_FIELDS = [
	'id',
	'name',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(CompanyAttributes).filter(attribute => {
	return CompanyAttributes[attribute].serverOnly;
});

const DEFAULT_COMPANY_PLAN = 'FREEPLAN';
const DEFAULT_ONPREM_COMPANY_PLAN = '14DAYTRIAL';
const COMPANIES_ON_TRIAL = false;
const ONPREM_COMPANIES_ON_TRIAL = true;

module.exports = {
	EXPECTED_COMPANY_FIELDS,
	UNSANITIZED_ATTRIBUTES,
	DEFAULT_COMPANY_PLAN,
	DEFAULT_ONPREM_COMPANY_PLAN,
	COMPANIES_ON_TRIAL,
	ONPREM_COMPANIES_ON_TRIAL
};

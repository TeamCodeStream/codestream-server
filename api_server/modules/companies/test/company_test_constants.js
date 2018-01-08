// test constants for testing the companies module

'use strict';

const CompanyAttributes = require(process.env.CS_API_TOP + '/modules/companies/company_attributes');

const EXPECTED_COMPANY_FIELDS = [
	'_id',
	'name',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(CompanyAttributes).filter(attribute => {
	return CompanyAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_COMPANY_FIELDS,
	UNSANITIZED_ATTRIBUTES
};

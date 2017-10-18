'use strict';

const Company_Attributes = require(process.env.CS_API_TOP + '/services/api/modules/companies/company_attributes');

const EXPECTED_COMPANY_FIELDS = [
	'_id',
	'name',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(Company_Attributes).filter(attribute => {
	return Company_Attributes[attribute].server_only;
});

module.exports = {
	EXPECTED_COMPANY_FIELDS,
	UNSANITIZED_ATTRIBUTES
};

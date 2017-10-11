'use strict';

const User_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/users/user_attributes');

const EXPECTED_USER_FIELDS = [
	'_id',
	'emails',
	'username',
	'first_name',
	'last_name',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id'
];

const EXPECTED_REGISTRATION_FIELDS = EXPECTED_USER_FIELDS.concat([
	'confirmation_code'
]);

const EXPECTED_USER_RESPONSE = {
	user: EXPECTED_USER_FIELDS
};

const EXPECTED_REGISTRATION_RESPONSE = {
	user: EXPECTED_REGISTRATION_FIELDS
};

const EXPECTED_LOGIN_RESPONSE = {
	user: EXPECTED_USER_FIELDS,
	access_token: 1
};

const UNSANITIZED_ATTRIBUTES = Object.keys(User_Attributes).filter(attribute => {
	return User_Attributes[attribute].server_only;
});

module.exports = {
	EXPECTED_USER_RESPONSE,
	EXPECTED_REGISTRATION_RESPONSE,
	EXPECTED_LOGIN_RESPONSE,
	UNSANITIZED_ATTRIBUTES
};

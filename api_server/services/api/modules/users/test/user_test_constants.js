'use strict';

const UserAttributes = require(process.env.CS_API_TOP + '/services/api/modules/users/user_attributes');

const EXPECTED_UNREGISTERED_USER_FIELDS = [
	'_id',
	'email',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId'
];

const EXPECTED_USER_FIELDS = EXPECTED_UNREGISTERED_USER_FIELDS.concat([
	'username',
	'firstName',
	'lastName'
]);

const EXPECTED_REGISTRATION_FIELDS = EXPECTED_USER_FIELDS.concat([
	'confirmationCode'	// only because we cheat using a special cheat code
]);

const EXPECTED_ME_FIELDS = [
	'lastReads'
];

const EXPECTED_USER_RESPONSE = {
	user: EXPECTED_USER_FIELDS
};

const EXPECTED_REGISTRATION_RESPONSE = {
	user: EXPECTED_REGISTRATION_FIELDS
};

const EXPECTED_LOGIN_RESPONSE = {
	user: EXPECTED_USER_FIELDS,
	accessToken: 1
};

const UNSANITIZED_ATTRIBUTES = Object.keys(UserAttributes).filter(attribute => {
	return UserAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_USER_RESPONSE,
	EXPECTED_REGISTRATION_RESPONSE,
	EXPECTED_LOGIN_RESPONSE,
	EXPECTED_USER_FIELDS,
	EXPECTED_ME_FIELDS,
	UNSANITIZED_ATTRIBUTES
};

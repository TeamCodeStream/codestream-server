'use strict';

const UserAttributes = require(process.env.CS_API_TOP + '/modules/users/user_attributes');

// we expect to see these fields for users who are not yet confirmed
const EXPECTED_UNREGISTERED_USER_FIELDS = [
	'_id',
	'email',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'_pubnubUuid'
];

// we expect to see these fields for users who are confirmed
const EXPECTED_USER_FIELDS = EXPECTED_UNREGISTERED_USER_FIELDS.concat([
	'username',
	'firstName',
	'lastName',
	'timeZone'
]);

// we expect to see these fields upon a registration
const EXPECTED_REGISTRATION_FIELDS = EXPECTED_USER_FIELDS.concat([
	'confirmationCode'	// only because we cheat using a special cheat code
]);

// we expect to see these fields when user is retrieving their own me-object
const EXPECTED_ME_FIELDS = [
	'lastReads'
];

// response to retrieving a user object looks like this
const EXPECTED_USER_RESPONSE = {
	user: EXPECTED_USER_FIELDS
};

// response to registration looks like this
const EXPECTED_REGISTRATION_RESPONSE = {
	user: EXPECTED_REGISTRATION_FIELDS
};

// response to a login request looks like this
const EXPECTED_LOGIN_RESPONSE = {
	user: EXPECTED_USER_FIELDS,
	accessToken: true,
	teams: true,
	repos: true
};

// these attributes should not be seen by the client
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

// Errors related to the users module

'use strict';

module.exports = {
	'unknownProvider': {
		code: 'PRVD-1000',
		message: 'Provider unknown',
		description: 'The provider info passed in has an unknown type'
	},
	'invalidProviderCredentials': {
		code: 'PRVD-1001',
		message: 'Supplied provider credentials were found to be invalid',
		description: 'The provider info passed contained credentials that the server tried to validate, but the validation failed'
	},
	'duplicateProviderAuth': {
		code: 'PRVD-1002',
		message: 'The user already has credentials for this provider',
		description: 'The provider info passed contained credentials for a third-party provider that did not match the credentials the user already has for the provider'
	},
	'unknownProviderHost': {
		code: 'PRVD-1003',
		message: 'The third-party provider host can not be matched to a known enterprise host',
		description: 'Enterprise customers should configure their installation with the hosts they wish users to be able to connect to for on-premise third-party integrations; the host passed in the request was not found among the known hosts for this installation'
	},
	'identityMatchingNotSupported': {
		code: 'PRVD-1004',
		message: 'Identity matching is not supported for this third-party provider',
		description: 'This third-party provider does not support matching an identity with a user on CodeStream'
	},
	'noIdentityMatch': {
		code: 'PRVD-1005',
		message: 'No CodeStream identity was found to match the identity from third-party provider authentication',
		description: 'After completing third-party provider authentication, a matching identity on CodeStream could not be found'
	},
	'providerAuthNotAllowed': {
		code: 'PRVD-1006',
		message: 'Third-party authentication is not allowed for this user',
		description: 'Users that are already registered on CodeStream are not allowed to authenticate with a third-party provider; they must sign in with their CodeStream credentials'
	},
	'providerDataRequestFailed': {
		code: 'PRVD-1007',
		message: 'A request for additional third-party provider data failed',
		description: 'Certain third-party providers require additional data after a user has authenticated'
	},
	'hostUrlRequired': {
		code: 'PRVD-1008',
		message: 'A host URL is required for this provider',
		description: 'Certain third-party providers require a host URL for the authorization and resource server'
	},
	'providerNotConfigured': {
		code: 'PRVD-1009',
		message: 'This provider is not configured for this environment',
		description: 'No tokens or credentials exist for this provider'
	},
	'gitlabPublicEmail': {
		code: 'PRVD-1010',
		message: 'Could not find a public email associated with the GitLab account',
		description: 'GitLab requires that the user\'s primary email be public for identity matching'
	}
};

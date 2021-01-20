// attributes for user documents/models

'use strict';

module.exports = {
	companyIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		description: 'Array of IDs representing the @@#companies#company@@ this user belongs to'
	},
	teamIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		description: 'Array of IDs representing the @@#teams#team@@ this user belongs to'
	},
	email: {
		type: 'email',
		maxLength: 256,
		required: false,
		description: 'The user\'s email'
	},
	searchableEmail: {
		type: 'email',
		maxLength: 256,
		required: false,
		serverOnly: true
	},
	secondaryEmails: {
		type: 'arrayOfEmails',
		maxLength: 20,
		maxEmailLength: 256,
		description: 'Array of additional emails the user uses'
	},
	username: {
		type: 'username',
		maxLength: 21,
		description: 'The user\'s username, unique to all @@#teams#team@@ the user is on'
	},
	isRegistered: {
		type: 'boolean',
		description: 'If true, the user has registered and confirmed their email'
	},
	firstName: {	// deprecated in favor of full name
		type: 'string',
		maxLength: 128,
		description: 'The user\'s first name'
	},
	lastName: {		// deprecated in favor of full name
		type: 'string',
		maxLength: 128,
		description: 'The user\'s last name'
	},
	fullName: {
		type: 'string',
		maxLength: 256,
		description: 'The user\'s full name'
	},
	passwordHash: {
		type: 'string',
		maxLength: 64,
		serverOnly: true
	},
	confirmationCode: {
		type: 'string',
		maxLength: 6,
		serverOnly: true
	},
	confirmationAttempts: {
		type: 'number',
		serverOnly: true
	},
	confirmationCodeExpiresAt: {
		type: 'timestamp',
		serverOnly: true
	},
	confirmationCodeUsableUntil: {
		type: 'timestamp',
		serverOnly: true
	},
	lastReads: {
		type: 'object',
		maxLength: 10000,
		serverOnly: true,
		forMe: true,
		description: 'Hash of last read @@#posts#post@@ in a given @@#stream#stream@@; the keys of the hash are stream IDs, the values are the sequence number of the last @@#post#post@@ the user has read in that stream; if there is no key for a given stream, the user is assumed to have read all posts in the stream; this attribute is only available to the user that owns it'
	},
	accessToken: {
		type: 'string',
		serverOnly: true
	},
	accessTokens: {
		type: 'object',
		serverOnly: true,
	},
	pubNubToken: {
		type: 'string',
		serverOnly: true
	},
	broadcasterToken: {
		type: 'string',
		serverOnly: true
	},
	hasReceivedFirstEmail: {
		type: 'boolean',
		serverOnly: true
	},
	preferences: {
		type: 'object',
		maxLength: 10000,
		serverOnly: true,
		forMe: true,
		description: 'Free-form object representing the user\'s preferences; this attribute is only visible to the user that owns it'
	},
	registeredAt: {
		type: 'timestamp',
		description: 'UNIX timestamp representing the date/time the user confirmed their registration'
	},
	joinMethod: {
		type: 'string',
		maxLength: '20',
		ignoreDescribe: true
	},
	primaryReferral: {
		type: 'string',
		maxLength: 12,
		ignoreDescribe: true
	},
	originTeamId: {
		type: 'id',
		ignoreDescribe: true
	},
	totalPosts: {
		type: 'number',
		serverOnly: true,
		forMe: true,
		description: 'Total number of posts this user has authored'
	},
	lastPostCreatedAt: {
		type: 'timestamp',
		serverOnly: true,
		forMe: true,
		description: 'UNIX timestamp of the last post this user authored'
	},
	totalReviews: {
		type: 'number',
		serverOnly: true,
		forMe: true,
		description: 'Total number of reviews this user has requested'
	},
	timeZone: {
		type: 'string',
		maxLength: 50,
		description: 'The user\'s time zone'
	},
	sessions: {
		type: 'object',
		serverOnly: true
	},
	_pubnubUuid: {
		type: 'string',
		maxLength: 14,
		ignoreDescribe: true
	},
	internalMethod: {
		type: 'string',
		maxLength: 20,
		serverOnly: true,
		forMe: true,
		ignoreDescribe: true
	},
	internalMethodDetail: {
		type: 'id',
		serverOnly: true,
		forMe: true,
		ignoreDescribe: true
	},
	numMentions: {
		type: 'number',
		serverOnly: true,
		forMe: true,
		description: 'Number of times this user has been mentioned in a post'
	},
	numInvites: {
		type: 'number',
		serverOnly: true,
		forMe: true,
		description: 'Number of times this user has been invited'
	},
	phoneNumber: {
		type: 'string',
		maxLength: 100,
		default: '',
		description: 'User\'s phone number'
	},
	iWorkOn: {
		type: 'string',
		maxLength: 200,
		default: '',
		description: 'Whatever the user works on'
	},
	lastActivityAt: {
		type: 'timestamp',
		serverOnly: true
	},
	lastEmailsSent: {
		type: 'object',
		serverOnly: true
	},
	providerIdentities: {
		type: 'arrayOfStrings',
		default: []
	},
	providerInfo: {
		type: 'object',
		serverOnly: true,
		forMe: true,
		description: 'Object containing credentials info for third-party providers'
	},
	lastLogin: {
		type: 'timestamp',
		description: 'Time the user last logged in (not including logging in from the web clienapp)'
	},
	lastOrigin: {
		type: 'string',
		maxLength: 20,
		description: 'Plugin IDE user was using when they last logged in'
	},
	lastOriginDetail: {
		type: 'string',
		maxLength: 40,
		description: 'Detail of plugin IDE user was using when they last logged in'
	},
	firstSessionStartedAt: {
		type: 'number',
		serverOnly: true,
		forMe: true,
		description: 'Indicates first session for the user, cleared upon second login or 12 hours after first login (by client)'
	},
	inviteCode: {
		type: 'string',
		maxLength: 200,
		description: 'Code used to match a team invite with a given user'
	},
	lastInviteType: {
		type: 'string',
		maxLength: 25,
		description: 'Invite type the last time this user was invited, one of: "invitation", "reinvitation", "reviewNotification", "codemarkNotification"'
	},
	firstInviteType: {
		type: 'string',
		maxLength: 25,
		description: 'Invite type the first time this user was invited, one of: "invitation", "reinvitation", "reviewNotification", "codemarkNotification"'
	},
	inviteTrigger: {
		type: 'string',
		maxLength: 25,
		description: 'The ID of the object that triggered the invite, which is a "C" or "R" (for codemark or review), followed by the actual ID'
	},
	companyName: {
		type: 'string',
		serverOnly: true,
		maxLength: 100,
		description: 'Temporary holding place for the company name, until the user actually creates a team'
	},
	externalUserId: {
		type: 'string',
		maxLength: 100,
		description: 'The id of a "faux" user'
	},
	inMaintenanceMode: {
		type: 'boolean',
		description: 'Indicates user should be road-blocked for account maintenance',
		serverOnly: true,
		forMe: true
	},
	mustSetPassword: {
		type: 'boolean',
		description: 'Indicates user should be road-blocked until they set a password',
		serverOnly: true,
		forMe: true
	},
	modifiedRepos: {
		type: 'object',
		description: 'Files the user has made local modifications to, by team',
		maxLength: 10000
	},
	modifiedReposModifiedAt: {
		type: 'object',
		description: 'Last modified timestamp for modifiedRepos, by team',
		maxLength: 1000
	},
	compactModifiedRepos: {
		type: 'object',
		description: 'Files the user has made local modifications to, compactified, by team',
		maxLength: 10000,
		maxObjectLength: 1000000
	},
	status: {
		type: 'object',
		description: 'User settable status that other team members can see',
		maxLength: 200
	},
	avatar: {
		type: 'object',
		description: 'Object describing user\'s headshot or avatar',
		maxLength: 300
	},
	countryCode: {
		type: 'string',
		description: 'Two-letter country code for the user, obtained from the IP on login',
		maxLength: 2
	},
	hasGitLens: {
		type: 'boolean',
		description: 'Indicates that user has GitLens installed'
	},
	needsAutoReinvites: {
		type: 'number',
		description: 'Indicates how many automatic reinvites are to be sent till we give up',
		serverOnly: true
    },
	lastInviteSentAt: {
		type: 'number',
		description: 'Last time an invite email was sent to this user',
		serverOnly: true
	},
	autoReinviteInfo: {
		type: 'object',
		description: 'Info about auto re-invitations to users (what team, etc)',
		serverOnly: true
	}
};

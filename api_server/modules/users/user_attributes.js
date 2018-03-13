'use strict';

module.exports = {
	companyIds: {
		type: 'arrayOfIds',
		maxLength: 256
	},
	teamIds: {
		type: 'arrayOfIds',
		maxLength: 256
	},
	email: {
		type: 'email',
		maxLength: 256,
		required: true
	},
	searchableEmail: {
		type: 'email',
		maxLength: 256,
		required: true,
		serverOnly: true
	},
	secondaryEmails: {
		type: 'arrayOfEmails',
		maxLength: 20,
		maxEmailLength: 256
	},
	username: {
		type: 'username',
		maxLength: 21
	},
	isRegistered: {
		type: 'boolean'
	},
	firstName: {
		type: 'string',
		maxLength: 128
	},
	lastName: {
		type: 'string',
		maxLength: 128
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
	lastReads: {
		type: 'object',
		maxLength: 10000,
		serverOnly: true,
		forMe: true
	},
	accessToken: {
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
		forMe: true
	},
	registeredAt: {
		type: 'timestamp'
	},
	joinMethod: {
		type: 'string',
		maxLength: '20'
	},
	totalPosts: {
		type: 'number',
		serverOnly: true,
		forMe: true
	},
	lastPostCreatedAt: {
		type: 'timestamp',
		serverOnly: true,
		forMe: true
	},
	timeZone: {
		type: 'string',
		maxLength: 50
	},
	sessions: {
		type: 'object',
		serverOnly: true
	}
};

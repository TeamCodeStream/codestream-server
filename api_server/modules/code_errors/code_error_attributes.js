// attributes for code errors

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this code error'
	},
	streamId: {
		type: 'string',
		default: '',
		maxLength: 150,
		description: 'The @@#stream#stream@@ this code error belongs to'
	},
	postId: {
		type: 'string',
		default: '',
		maxLength: 150,
		description: 'The @@#post#post@@ that points to this code error'
	},
	fileStreamIds: {
		type: 'arrayOfIds',
		maxLength: 500,
		description: 'The IDs of all the @@#file streams#stream@@ with contributions to this code error'
	},
	codemarkIds: {
		type: 'arrayOfIds',
		maxLength: 100,
		description: 'The IDs of any @@#codemarks#codemark@@ associated with this code error'
	},
	markerIds: {
		type: 'arrayOfIds',
		maxLength: 1000,
		description: 'The IDs of any @@#markers#marker@@ associated with this code error'
	},
	title: {
		type: 'string',
		maxLength: 1000,
		description: 'Title of the code error'
	},
	assignees: {
		type: 'arrayOfStrings',
		maxLength: 200,
		description: 'Array of user IDs to whom this code error is assigned'
	},
	/*
	text: {
		type: 'string',
		maxLength: 10000,
		description: 'The text/description of this code error'
	},
	*/
	origin: {
		type: 'string',
		maxLength: 20,
		description: 'Origin of the review, usually the IDE'
	},
	originDetail: {
		type: 'string',
		maxLength: 40,
		description: 'Origin detail of the review, usually the IDE'
	},
	status: {
		type: 'string',
		maxLength: 20,
		description: 'Status of this code error'
	},
	followerIds: {
		type: 'arrayOfIds',
		maxLength: 1000,
		description: 'Array of user IDs representing followers of this code error; followers receive notifications when the code error is created and when there are replies'
	},
	numReplies: {
		type: 'number',
		default: 0,
		description: 'The number of replies to this code error'
	},
	lastReplyAt: {
		type: 'timestamp',
		description: 'Timestamp of the last reply to this code error, if any'
	},
	lastActivityAt: {
		type: 'timestamp',
		description: 'If the code error has codemarks or replies, same as lastReplyAt, otherwise same as createdAt'
	},
	authorsById: {
		type: 'object',
		maxLength: 1000,
		description: 'Hash where user IDs are keys, indicating the authors of code referenced by this code error'
	},
	permalink: {
		type: 'string',
		maxLength: 1000,
		description: 'Private permalink URL for this code error'
	},
	resolvedAt: {
		type: 'timestamp',
		description: 'When this code error was resolved'
	},
	resolvedBy: {
		type: 'object',
		maxLength: 10000,
		description: 'Hash representing people who have resolved the code error, keys are the user IDs, and values are objects containing additional information: for now just resolvedAt, the timestamp of the resolution'
	},
	ticketUrl: {
		type: 'string',
		maxLength: 1000,
		description: 'URL for the third-party ticket or issue associated with this code error'
	},
	ticketProviderId: {
		type: 'string',
		maxLength: 50,
		description: 'Identifies the third-party provider hosting the ticket or issue associated with this code error'
	},
	codeAuthorIds: {
		type: 'arrayOfIds',
		maxLength: 1000,
		description: 'Array of user IDs representing authors of the code referenced by this code error'
	},
	entryPoint: {
		type: 'string',
		maxLength: 100,
		description: 'Entry point used to create this code error'
	},
	stackTrace: {
		type: 'string',
		maxLength: 10000,
		description: 'Raw text of the stack trace associated with this code error'
	},
	stackInfo: {
		type: 'object',
		maxLength: 10000,
		description: 'Hash describing the strack trace, as parsed'
	},
	providerUrl: {
		type: 'string',
		maxLength: 1000,
		description: 'URL to the code error in the provider'
	}
};

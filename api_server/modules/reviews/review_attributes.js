// attributes for reviews

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this code review'
	},
	streamId: {
		type: 'string',
		default: '',
		maxLength: 150,
		description: 'The @@#stream#stream@@ this code review belongs to'
	},
	postId: {
		type: 'string',
		default: '',
		maxLength: 150,
		description: 'The @@#post#post@@ that points to this code review'
	},
	fileStreamIds: {
		type: 'arrayOfIds',
		maxLength: 500,
		description: 'The IDs of all the @@#file streams#stream@@ with contributions to this code review'
	},
	codemarkIds: {
		type: 'arrayOfIds',
		maxLength: 100,
		description: 'The IDs of any @@#codemarks#codemark@@ associated with this code review'
	},
	markerIds: {
		type: 'arrayOfIds',
		maxLength: 1000,
		description: 'The IDs of any @@#markers#marker@@ associated with this code review'
	},
	title: {
		type: 'string',
		maxLength: 1000,
		description: 'Title of the code review'
	},
	reviewers: {
		type: 'arrayOfStrings',
		maxLength: 200,
		description: 'Array of user IDs to whom this code review is assigned'
	},
	text: {
		type: 'string',
		maxLength: 10000,
		description: 'The text/description of this code review'
	},
	origin: {
		type: 'string',
		maxLength: 20,
		description: 'Origin of the review, usually the IDE'
	},
	status: {
		type: 'string',
		maxLength: 20,
		description: 'Status of this code review'
	},
	followerIds: {
		type: 'arrayOfIds',
		maxLength: 1000,
		description: 'Array of user IDs representing followers of this code review; followers receive notifications when the review is created and when there are replies'
	},
	numReplies: {
		type: 'number',
		default: 0,
		description: 'The number of replies to this code review'
	},
	lastReplyAt: {
		type: 'timestamp',
		description: 'Timestamp of the last reply to this codemark, if any'
	},
	lastActivityAt: {
		type: 'timestamp',
		description: 'If the review has codemarks or replies, same as lastReplyAt, otherwise same as createdAt'
	},
	tags: {
		type: 'arrayOfStrings',
		maxLength: 50,
		description: 'The IDs of any tags associated with this codemark'
	},
	reviewChangesets: {
		type: 'arrayOfObjects',
		maxLength: 50,
		maxObjectLength: 10000,
		description: 'Array of changesets associated with this review, one per repo'
	},
	reviewDiffs: {
		type: 'object',
		maxObjectLength: 10000000,
		description: 'Keys are repo IDs, values are the diff sets corresponding to the changesets that were passed in when the review was created'
	},
	authorsById: {
		type: 'object',
		maxLength: 1000,
		description: 'Hash where user IDs are keys, indicating the authors of code referenced by this code review'
	}
};

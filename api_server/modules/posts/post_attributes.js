// attributes for post documents/models

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this post'
	},
	streamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#stream#stream@@ in which the post was created'
	},
	parentPostId: {
		type: 'id',
		description: 'For posts that are replies to other posts, the ID of the post to which this post is a reply'
	},
	numReplies: {
		type: 'number',
		default: 0,
		description: 'Number of replies to this post'
	},
	text: {
		type: 'string',
		maxLength: 10000,
		description: 'The text of the post'
	},
	seqNum: {
		type: 'number',
		required: true,
		description: 'The auto-incrementing sequence number for this post; starting at 1, each post in a given @@#stream#stream@@ gets an auto-incrementing sequence number indicating the post\'s order int he stream'
	},
	hasBeenEdited: {
		type: 'boolean',
		description: 'If true, the text of the post has been edited at least once'
	},
	editHistory: {
		type: 'arrayOfObjects',
		serverOnly: true	// normally, but it can be retrieved separately
	},
	mentionedUserIds: {
		type: 'arrayOfIds',
		maxLength: 100,
		description: 'Array of IDs representing @@#users#user@@ who are mentioned in the post'
	},
	origin: {
		type: 'string',
		maxLength: 20,
		description: 'Origin of the post: "email" for an email reply, "slack" for a reply from Slack, "teams" for a reply from MSTeams'
	},
	originDetail: {
		type: 'string',
		maxLength: 40,
		description: 'Origin detail of the post'
	},
	reactions: {
		type: 'object',
		maxLength: 5000,
		description: 'Keys are the reaction (eg. \'smiley\', \'frown\', etc), and values are an array of user IDs, representing the users who picked that reaction',
		default: {}
	},
	codemarkId: {
		type: 'id',
		description: 'ID of the knowledge base codemark attached to this post, if any'
	},
	reviewId: {
		type: 'id',
		description: 'ID of the code review attached to this post, if any'
	},
	reviewCheckpoint: {
		type: 'number',
		description: 'Checkpoint number of the review this post is associated with'
	},
	files: {
		type: 'arrayOfObjects',
		maxLength: 20,
		maxObjectLength: 500,
		description: 'Attachments to this codemark'
	},
	sharedTo: {
		type: 'arrayOfObjects',
		maxLength: 10,
		maxObjectLength: 500,
		description: 'Third-party providers to whom this post has been shared'
	},
	codeErrorId: {
		type: 'id',
		description: 'ID of the code error attached to this post, if any'
	},
};

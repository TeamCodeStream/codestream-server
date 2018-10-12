// attributes for post documents/models

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this post'
	},
	repoId: {
		type: 'id',
		description: 'For posts that belong to file @@#streams#stream@@, the ID of the @@#repo#repo@@ to which the file associated with the stream belongs'
	},
	streamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#stream#stream@@ in which the post was created'
	},
	commitHashWhenPosted: {
		type: 'string',
		minLength: 40,
		maxLength: 40,
		description: 'For file @@#streams#stream@@, the commit SHA that the user was on in their repo, when they created the post'
	},
	codeBlocks: {
		type: 'arrayOfObjects',
		maxLength: 10,
		maxObjectLength: 10000,
		description: 'Array of code blocks referenced by this post'
	},
	parentPostId: {
		type: 'id',
		description: 'For posts that are replies to other posts, the ID of the post to which this post is a reply'
	},
	hasReplies: {
		type: 'boolean',
		description: 'Will be true for posts that have replies'
	},
	numReplies: {
		type: 'number',
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
	reactions: {
		type: 'object',
		maxLength: 5000,
		description: 'Keys are the reaction (eg. \'smiley\', \'frown\', etc), and values are an array of user IDs, representing the users who picked that reaction',
		default: {}
	},
	providerType: {
		type: 'string',
		maxLength: 20,
		description: 'For third-party integrations, type of provider (slack, msteams, etc.) the post is associated with'
	},
	providerPostId: {
		type: 'string',
		maxLength: 40,
		description: 'For third-party integrations, ID of the post that this post references in the third-party integration provider'
	},
	providerConversationId: {
		type: 'string',
		maxLength: 40,
		description: 'For third-party integrations, ID of the conversation (team, group, DM) to which this post belongs in the the third-party integration provider'
	},
	providerInfo: {
		type: 'object',
		maxLength: 1000,
		description: 'For third-party integrations, free-form object for additional info relevant to the third-party post'
	},
	type: {
		type: 'string',
		maxLength: 25,
		description: 'Type of the post, like "comment", "question", "code trap", etc.'
	},
	color: {
		type: 'string',
		maxLength: 20,
		description: 'Display color, for highlighting'
	},
	status: {
		type: 'string',
		maxLength: 25,
		description: 'Status of certain types of posts, like "Open" or "Closed"'
	},
	title: {
		type: 'string',
		maxLength: 1000,
		description: 'Title of the post'
	},
	assignees: {
		type: 'arrayOfIds',
		maxLength: 200,
		description: 'Array of user IDs to whom a task is assigned'
	}
};

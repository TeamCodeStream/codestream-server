// attributes for codemarks

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this codemark'
	},
	streamId: {
		type: 'string',
		default: '',
		maxLength: 50,
		description: 'The @@#stream#stream@@ this codemark belongs to'
	},
	postId: {
		type: 'string',
		default: '',
		maxLength: 50,
		description: 'The @@#post#post@@ that points to this codemark'
	},
	parentPostId: {
		type: 'string',
		maxLength: 50,
		description: 'If this codemark is part of a reply to a @@#post#post@@, the ID of the parent post'
	},
	markerIds: {
		type: 'arrayOfIds',
		maxLength: 10,
		description: 'The IDs of any @@#markers#marker@@ associated with this codemark'
	},
	fileStreamIds: {
		type: 'arrayOfIds',
		maxLength: 10,
		description: 'The Ids of the @@#file streams#stream@@ from which the @@#markers#marker@@ originate'
	},
	providerType: {
		type: 'string',
		maxLength: 25,
		description: 'Third-party provider, as needed (eg. slack)'
	},
	type: {
		type: 'codemarkType',
		required: true,
		maxLength: 25,
		description: 'Type of the codemark, like "question", "trap", etc.'
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
		type: 'arrayOfStrings',
		maxLength: 200,
		description: 'Array of user IDs to whom a task is assigned'
	},
	text: {
		type: 'string',
		maxLength: 1000,
		description: 'The text of this codemark'
	},
	numReplies: {
		type: 'number',
		default: 0,
		description: 'The number of replies to this codemark'
	},
	pinned: {
		type: 'boolean',
		default: true,
		description: 'Codemark is pinned, meaning it is displayed on the Annotations panel (the default)'
	},
	pinnedReplies: {
		type: 'arrayOfStrings',
		maxLength: 100,
		description: 'Array of post IDs representing posts that are replies to this codemark, and which are "pinned" to the codemark'
	},
	origin: {
		type: 'string',
		maxLength: 20,
		description: 'Origin of the codemark, usually the IDE'
	},
	externalAssignees: {
		type: 'arrayOfObjects',
		maxLength: 50,
		maxObjectLength: 256,
		description: 'Array of assignees to this issue codemark, as known to its external provider'
	},
	externalProvider: {
		type: 'string',
		maxLength: 25,
		description: 'External provider for this codemark (eg. github, trello)'
	},
	externalProviderUrl: {
		type: 'string',
		maxLength: 1000,
		description: 'Link to the issue in its external provider'
	},
	hasPublicPermalink: {
		type: 'boolean',
		serverOnly: true,
		description: 'Indicates if a public permalink has been generated for this codemark'
	},
	invisible: {
		type: 'boolean',
		description: 'Indicates this codemark is "invisible", meaning it should not really be seen in the UI'
	},
	remoteCodeUrl: {
		type: 'object',
		maxLength: 500,
		description: 'Object referencing a link to the code block references by this codemark in an external provider, contains "name" and "url"'
	},
	threadUrl: {
		type: 'object',
		maxLength: 500,
		description: 'Object referencing a link to the thread in which this codemark was created'
	}
};

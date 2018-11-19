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
		description: 'The @@#stream#stream@@ this codemark belongs to'
	},
	postId: {
		type: 'string',
		default: '',
		description: 'The @@#post#post@@ that points to this codemark'
	},
	parentPostId: {
		type: 'string',
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
	}
};

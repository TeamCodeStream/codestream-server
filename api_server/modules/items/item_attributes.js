// attributes for items

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns this item'
	},
	streamId: {
		type: 'string',
		default: '',
		description: 'The @@#stream#stream@@ this item belongs to'
	},
	postId: {
		type: 'string',
		default: '',
		description: 'The @@#post#post@@ that points to this item'
	},
	markerIds: {
		type: 'arrayOfIds',
		maxLength: 10,
		description: 'The IDs of any @@#markers#marker@@ associated with this item'
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
		type: 'string',
		required: true,
		maxLength: 25,
		description: 'Type of the item, like "question", "code trap", etc.'
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
	},
	text: {
		type: 'string',
		maxLength: 1000,
		description: 'The text of this item'
	},
	numReplies: {
		type: 'number',
		default: 0,
		description: 'The number of replies to this item'
	}
};

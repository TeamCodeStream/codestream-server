// attributes for markers, note that we don't derive from the standard
// CodeStreamModel here, so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns the file @@#stream#stream@@ this marker references'
	},
	streamId: {
		type: 'id',
		required: true,
		description: 'ID of the file @@#stream#stream@@ references by this marker\'s code block'
	},
	postId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#post#post@@ that references this marker\'s code block'
	},
	postStreamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#stream#stream@@ the @@#post#post@@ that references this marker\'s code block belongs to'
	},
	numComments: {
		type: 'number',
		required: true,
		description: 'Number of @@#posts#post@@ created as a reply to the original post containing this marker\'s code block'
	},
	commitHashWhenCreated: {
		type: 'string',
		minLength: 40,
		maxLength: 40,
		description: 'The commit SHA the @@#user#user@@ was on in their repo when this marker\'s code block was first created in a @@#post#post@@'
	},
	codeBlock: {
		type: 'object',
		maxLength: 1000,
		description: 'Code block referenced by this marker'
	},
	_forTesting: {
		type: 'boolean',
		serverOnly: true
	}
};

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
	streamId: {	// to be deprecated in favor of fileStreamId
		type: 'id',
		required: true,
		description: 'ID of the file @@#stream#stream@@ referenced by this marker\'s code block'
	},
	fileStreamId: {
		type: 'id',
		required: true,
		description: 'ID of the file @@#stream#stream@@ referenced by this marker\'s code block'
	},
	postId: {
		type: 'string',
		description: 'ID of the @@#post#post@@ that references this marker\'s code block, or can be a third-party post ID'
	},
	postStreamId: {
		type: 'string',
		description: 'ID of the @@#stream#stream@@ the @@#post#post@@ that references this marker\'s code block belongs to, or can be a third-party stream ID'
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
		description: 'The commit SHA the @@#user#user@@ was on in their repo when this marker\'s code block was first created'
	},
	codeBlock: {	// to be deprecated in favor of individual attributes at the top-level
		type: 'object',
		maxLength: 1000,
		description: 'Code block referenced by this marker'
	},
	providerType: {
		type: 'string',
		maxLength: 25,
		description: 'Third-party provider, as needed (eg. slack)'
	},
	code: {
		type: 'string',
		maxLength: 10000,
		description: 'The code associated with this marker'
	},
	file: {
		type: 'string',
		maxLength: 1024,
		description: 'The path of the file the code comes from, assumed to be from the root of the @@#repo#repo@@'
	},
	repo: {
		type: 'string',
		maxLength: 1024,
		description: 'URL of the @@#repo#repo@@ the file comes from'
	},
	repoId: {
		type: 'id',
		description: 'ID of the repo the file containing this code comes from'
	},
	locationWhenCreated: {
		type: 'array',
		description: 'Location coordinates of the code when the marker was first created'
	},
	itemIds: {
		type: 'arrayOfIds',
		maxLength: 10,
		description: 'IDs representing the knowledge-base items attached to this marker'
	}
};

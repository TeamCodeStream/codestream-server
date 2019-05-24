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
	fileStreamId: {
		type: 'id',
		description: 'ID of the file @@#stream#stream@@ referenced by this marker'
	},
	postStreamId: {
		type: 'string',
		maxLength: 150,
		description: 'ID of the @@#stream#stream@@ of the @@#post#post@@ that references this marker, or can be a third-party stream ID'
	},
	postId: {
		type: 'string',
		maxLength: 150,
		description: 'ID of the @@#post#post@@ that references this marker, or can be a third-party post ID'
	},
	codemarkId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#codemark#codemark@@ that references this marker'
	},
	providerType: {
		type: 'string',
		maxLength: 25,
		description: 'Third-party provider, as needed (eg. slack)'
	},
	commitHashWhenCreated: {
		type: 'string',
		minLength: 40,
		maxLength: 40,
		description: 'The commit SHA the @@#user#user@@ was on in their repo when this marker was first created'
	},
	locationWhenCreated: {
		type: 'array',
		description: 'Location coordinates of the code when the marker was first created'
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
	}
};

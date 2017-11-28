'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true
	},
	repoId: {
		type: 'id'
	},
	streamId: {
		type: 'id',
		required: true
	},
	commitHashWhenPosted: {
		type: 'string',
		minLength: 40,
		maxLength: 40
	},
	codeBlocks: {
		type: 'arrayOfObjects',
		maxLength: 10,
		maxObjectLength: 10000
	},
	parentPostId: {
		type: 'id'
	},
	text: {
		type: 'string',
		maxLength: 10000
	}
};

// Errors related to the posts module

'use strict';

module.exports = {
	'seqNumNotFound': {
		code: 'POST-1000',
		message: 'Sequence number not found',
		description: 'A sequence number provided as a pivot point for a posts query was not found to pivot on'
	},
	'noReplyToReply': {
		code: 'POST-1001',
		message: 'Can not reply to a reply',
		description: 'An attempt was made to post a reply to a post that is already a reply to another post'
	}
};

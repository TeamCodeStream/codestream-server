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
	},
	'noCodemarkAndReview': {
		code: 'POST-1002',
		message: 'Can not post a codemark and a review at the same time',
		description: 'With the submitted post, a codemark object and a review object were sent, but only one of these is allowed'
	},
	'noReplyWithReview': {
		code: 'POST-1003',
		message: 'Can not post a code review as a reply',
		description: 'With the submitted post, a parentPostId and a review object were sent, but a code review can not be posted as a reply'
	}
};

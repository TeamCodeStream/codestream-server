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
	},
	'noCodemarkAndCodeError': {
		code: 'POST-1004',
		message: 'Can not post a codemark and a code error at the same time',
		description: 'With the submitted post, a codemark object and a code error object were sent, but only one of these is allowed'
	},
	'noReplyWithCodeError': {
		code: 'POST-1005',
		message: 'Can not post a code error as a reply',
		description: 'With the submitted post, a parentPostId and a code error object were sent, but a code error can not be posted as a reply'
	},
	'parentPostStreamIdMismatch': {
		code: 'POST-1006',
		message: 'The stream of the post does not match the stream of the parent post',
		description: 'The submitted post had a parentPostId referring to a post that is in a different stream than the streamId in the submitted post'
	},
	'replyToImproperPost': {
		code: 'POST-1007',
		message: 'A reply is being posted to an improper post',
		description: 'The submitted post was in reply to another post, but the submitted data does not match the parent post'
	},
	'noReviewAndCodeError': {
		code: 'POST-1008',
		message: 'Can not post a review and a code error at the same time',
		description: 'With the submitted post, a review object and a code error object were sent, but only one of these is allowed'
	}
};

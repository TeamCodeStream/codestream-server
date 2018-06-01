// Errors related to the posts module

'use strict';

module.exports = {
	'seqNumNotFound': {
		code: 'POST-1000',
		message: 'Sequence number not found',
		description: 'A sequence number provided as a pivot point for a posts query was not found to pivot on'
	}
};

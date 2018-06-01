// Errors related to the repos module

'use strict';

module.exports = {
	'shaMismatch': {
		code: 'REPO-1000',
		message: 'SHA of first commit doesn\'t match',
		description: 'A request to match a repo was sent, but the first commit hash sent with the request does not match the first commit hash on record for that repo'
	},
	'repoMessagingGrant': {
		code: 'REPO-1001',
		message: 'Unable to grant user messaging permissions',
		description: 'The server was unable to grant permission to subscribe to the given repo channel'
	}
};

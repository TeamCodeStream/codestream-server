// Errors related to the codemarks module

'use strict';

module.exports = {
	'invalidReplyPost': {
		code: 'CMRK-1000',
		message: 'Pinned post must be a reply to the codemark',
		description: 'An attempt was made to pin a post to a codemark, but the post is not a reply to the codemark'
	}
};

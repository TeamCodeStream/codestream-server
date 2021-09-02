// handle the DELETE /nr-comments/:id request to deactivate a New Relic comment

'use strict';

const PutNRCommentRequest = require('./put_nr_comment_request');

class DeleteNRCommentRequest extends PutNRCommentRequest {

	async process () {
		this.deactivate = true;
		return super.process();
	}
}

module.exports = DeleteNRCommentRequest;

// handle a GET /add-nr-org request to add an NR account to org mapping,
// for internal use only

'use strict';

const NRCommentRequest = require('./nr_comment_request');

class AddNROrgRequest extends NRCommentRequest {

	async process () {
		// handle which attributes are required and allowed for the request
		await this.requireAllow();

		await this.api.data.newRelicOrgs.create({
			accountId: this.request.body.accountId,
			orgId: this.request.body.orgId
		});
	}

	// handle which attributes are required and allowed for this request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					number: ['accountId'],
					string: ['orgId'],
				}
			}
		);
	}
}

module.exports = AddNROrgRequest;

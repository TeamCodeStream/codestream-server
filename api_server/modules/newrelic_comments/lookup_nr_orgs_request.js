// handle a GET /lookup-nr-org request to lookup a New Relic org ID by account ID

'use strict';

const Indexes = require('./new_relic_org_indexes');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class LookupNROrgsRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary, any registered user can do it
	}

	async process () {
		await this.requireAllow();

		const accountIds = this.request.body.accountIds;
		const records = await this.api.data.newRelicOrgs.getByQuery(
			{ accountId: { $in: accountIds } },
			{ hint: Indexes.byAccountId }
		);
		this.responseData = records.map(record => {
			return {
				accountId: record.accountId,
				orgId: record.orgId
			};
		});
	}

	// handle which attributes are required and allowed for this request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					'array(number)': ['accountIds']
				}
			}
		);
	}
}

module.exports = LookupNROrgsRequest;

// handle a GET /lookup-nr-org request to lookup a New Relic org ID by account ID

'use strict';

const Indexes = require('./new_relic_org_indexes');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class LookupNROrgRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary, any registered user can do it
	}

	async process () {
		const accountId = this.request.query.accountId;
		if (!accountId) {
			throw this.errorHandler.error('parameterRequired', { info: 'accountId '});
		}
		const accountIdNum = parseInt(accountId, 10);
		if (isNaN(accountIdNum)) {
			throw this.errorHandler.error('invalidParameter', { info: 'accountId' });
		}
		const record = await this.api.data.newRelicOrgs.getOneByQuery(
			{ accountId: accountIdNum },
			{ hint: Indexes.byAccountId }
		);
		if (!record) {
			this.responseData = {}
		} else {
			this.responseData = { orgId: record.orgId };
		}
	}
}

module.exports = LookupNROrgRequest;

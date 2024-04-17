// handle the 'GET /entities' request, to fetch one or more New Relic entities

'use strict';

const GetManyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetEntitiesRequest extends GetManyRequest {

	async authorize () {
		// you have access to the entities if you have access to the team ... teamId is required
		await this.user.authorizeFromTeamId(this.request.query, this);
	}

	// build the query to fetch multiple entities from the database
	buildQuery () {
		if (!this.request.query.teamId) {
			return this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		let query = {
			teamId: decodeURIComponent(this.request.query.teamId).toLowerCase()
		};
		return query;
	}

	// get options associated with the database query to fetch multiple entities
	getQueryOptions () {
		return { hint: Indexes.byTeamId };
	}
}

module.exports = GetEntitiesRequest;

// handle the 'GET /repos' request, to fetch one or more repos

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetReposRequest extends GetManyRequest {

	async authorize () {
		// you have access to the repos if you have access to the team ... teamId is required
		await this.user.authorizeFromTeamId(this.request.query, this);
	}

	// build the query to fetch multiple objects from the database
	buildQuery () {
		if (!this.request.query.teamId) {
			return this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		let query = {
			teamId: decodeURIComponent(this.request.query.teamId).toLowerCase()
		};
		if (this.request.query.ids) {
			// you can specify particular IDs, but they must all be from the same team
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			query._id = this.data.repos.inQuerySafe(ids);
		}
		return query;
	}

	// get options associated with the database query to fetch multiple repos
	getQueryOptions () {
		return {
			databaseOptions: {
				hint: Indexes.byTeamId
			}
		};
	}

	// describe this route for help
	static describe () {
		const description = GetManyRequest.describe(module);
		description.access = 'User must be a member of the team for which repos are being fetched';
		description.input.looksLike['teamId*'] = '<ID of the team for which repos are being fetched>';
		return description;
	}
}

module.exports = GetReposRequest;

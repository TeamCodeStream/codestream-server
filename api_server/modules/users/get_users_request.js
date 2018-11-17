// handle the "GET /users" request to fetch several users

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetUsersRequest extends GetManyRequest {

	async authorize () {
		// members of the same team can fetch each other
		await this.user.authorizeFromTeamId(this.request.query, this);
	}

	// build the query for fetching the users, based on input parameters
	buildQuery () {
		// must have a team ID
		if (!this.request.query.teamId) {
			return this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		let query = {
			teamIds: decodeURIComponent(this.request.query.teamId).toLowerCase()
		};
		// can also specify individual IDs
		if (this.request.query.ids) {
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			query.id = this.data.users.inQuerySafe(ids);
		}
		return query;
	}

	// get options to use in the query to fetch users
	getQueryOptions () {
		// provide appropriate index, by team
		return { hint: Indexes.byTeamIds };
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.access = 'User must be a member of the team for which users are being fetched';
		description.description = 'Fetch the users for a team',
		description.input.looksLike['teamId*'] = '<ID of the team for which users are being fetched>';
		return description;
	}
}

module.exports = GetUsersRequest;

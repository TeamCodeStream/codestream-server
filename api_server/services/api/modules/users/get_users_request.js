'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetUsersRequest extends GetManyRequest {

	authorize (callback) {
		this.user.authorizeFromTeamId(this.request.query, this, callback);
	}

	buildQuery () {
		if (!this.request.query.teamId) {
			return this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		let query = {
			teamIds: decodeURIComponent(this.request.query.teamId).toLowerCase()
		};
		if (this.request.query.ids) {
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			query._id = this.data.users.inQuerySafe(ids);
		}
		return query;
	}

	getQueryOptions () {
		return {
			databaseOptions: {
				hint: Indexes.byTeamIds
			}
		};
	}
}

module.exports = GetUsersRequest;

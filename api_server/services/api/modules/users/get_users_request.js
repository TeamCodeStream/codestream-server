'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class GetUsersRequest extends GetManyRequest {

	authorize (callback) {
		if (!this.request.query.teamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		let teamId = decodeURIComponent(this.request.query.teamId).toLowerCase();
		if (!this.user.hasTeam(teamId)) {
			return callback(this.errorHandler.error('readAuth'));
		}
		return process.nextTick(callback);
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
			ids = ids.map(id => this.data.users.objectIdSafe(id));
			query._id = { $in: ids };
		}
		return query;
	}
}

module.exports = GetUsersRequest;

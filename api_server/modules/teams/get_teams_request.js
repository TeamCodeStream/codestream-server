// handle a GET /streams request to fetch multiple teams

'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');

class GetTeamsRequest extends GetManyRequest {

	// authorize the request for the current user
	authorize (callback) {
		if (this.request.query.hasOwnProperty('mine')) {
			// user has access to their own teams by definition
			return callback();
		}
		else if (!this.request.query.ids) {
			// must provide IDs
			return callback(this.errorHandler.error('parameterRequired', { info: 'ids' }));
		}
		// user must be a member of the requested teams
		let teamIds = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
		if (!this.user.hasTeams(teamIds)) {
			return callback(this.errorHandler.error('readAuth'));
		}
		return process.nextTick(callback);
	}

	// process the request (override base class)
	process (callback) {
		// if "mine" specified, fetch the teams in my teamIds array
		if (this.request.query.hasOwnProperty('mine')) {
			this.ids = this.user.get('teamIds') || [];
		}
		super.process(callback);
	}
}

module.exports = GetTeamsRequest;

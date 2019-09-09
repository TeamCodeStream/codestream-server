'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class Web404Request extends APIRequest {
	async authorize() {
	}
	async process() {
		let teamName;
		if (this.request.query) {
			const teamId = this.request.query.teamId;
			if (teamId) {
				const team = await this.data.teams.getById(teamId);
				if (team) {
					teamName = team.get('name');
				}
			}
		}
		this.module.evalTemplate(this, '404', {
			teamName: teamName,
			isAuthenticated: this.user != null
		});
	}
}

module.exports = Web404Request;

// handles the GET request
'use strict';

const WebRequestBase = require('./web_request_base');
const SigninFlowUtils = require('./signin_flow_utils');

class WebAssignTeamRequest extends WebRequestBase {
	async authorize () {
		if (!this.user) {
			return super.authorize();
		}
	}

	async process () {
		const tenantId = decodeURIComponent(this.request.query.tenantId || '');
		if (!tenantId) {
			this.warn('No tenantId found in request');
			this.redirectError();
			return;
		}

		const teamIds = this.user.get('teamIds');
		// if we ever want to show a UI here, we can uncomment this
		// and reander the UI for the user to choose a team

		// if (teamIds && teamIds.length === 1) {			
		const flow = new SigninFlowUtils(this);
		const token = await flow.insertToken(teamIds, tenantId);
		this.responseHandled = flow.finish(null, {
			tenantToken: token.token
		});
		// }
		// else {
		// 	const teams = await this.data.teams.getByIds(teamIds);
		// 	return super.render('assign_team', {
		// 		teams: teams.map(_ => {
		// 			return {
		// 				id: _.id,
		// 				name: _.get('name')
		// 			};
		// 		}),
		// 		tenantId: tenantId,
		// 		csrf: this.request.csrfToken()
		// 	});
		// }
	}

	redirectError () {
		this.response.redirect('/web/error');
		this.responseHandled = true;
	}
}

module.exports = WebAssignTeamRequest;

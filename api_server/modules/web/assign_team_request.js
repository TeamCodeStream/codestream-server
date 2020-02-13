// handles the POST request
'use strict';

const AuthErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const UserErrors = require(process.env.CS_API_TOP + '/modules/users/errors');
const WebRequestBase = require('./web_request_base');
const SigninFlowUtils = require('./signin_flow_utils');

class AssignTeamRequest extends WebRequestBase {

	constructor (options) {
		super(options);
		this.errorHandler.add(UserErrors);
		this.errorHandler.add(AuthErrors);
	}

	async authorize () {
		if (!this.user) {
			return super.authorize();
		}
	}

	async requireAndAllow () {
		delete this.request.body._csrf;
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'tenantId']
				}
			}
		);
	}

	async process () {
		await this.requireAndAllow();

		let { tenantId, teamId } = this.request.body;
		tenantId = decodeURIComponent(tenantId || '');
		if (!tenantId) {
			this.warn('No tenantId found in request');
			this.redirectError();
			return;
		}
		teamId = decodeURIComponent(teamId || '');
		if (!teamId) {
			this.warn('No teamId found in request');
			this.redirectError();
			return;
		}

		try {
			const flow = new SigninFlowUtils(this);
			const token = await flow.insertToken([teamId], tenantId);
			this.responseHandled = flow.finish(null, {
				tenantToken: token.token
			});
		}
		catch (error) {
			if (typeof error === 'object' && error.code === 'RAPI-1005') {
				this.render({
					error: error.info || 'something unexpected happened'
				});
				return;
			}

			// something else bad happened -- just redirect to failure screen
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn('Error assigning team: ' + message);
			this.redirectError();
			return;
		}
	}

	redirectError () {
		this.response.redirect('/web/error');
		this.responseHandled = true;
	}
}

module.exports = AssignTeamRequest;

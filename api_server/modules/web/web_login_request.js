'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');
const WebErrors = require('./errors');
const Handlebars = require('handlebars');
const Icons = require('./icons.json');

class WebLoginRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		const csrf = this.request.csrfToken();
		const email = this.request.query.email ? decodeURIComponent(this.request.query.email) : '';
		const teamId = this.request.query.teamId ? this.request.query.teamId.toLowerCase() : '';
		const error = this.request.query.error ? this.handleError() : '';
		const finishUrl = decodeURIComponent(this.request.query.url || '');
		const tenantId = decodeURIComponent(this.request.query.tenantId || '');
		let gitHubLink = '/web/provider-auth/github?noSignup=1';
		if (tenantId) {
			// if you have a tenantId, you cannot redirect elsewhere
			gitHubLink += `&tenantId=${tenantId}`;
		}
		else if (finishUrl) {
			// since GitHub isn't POSTed, we attach the finishUrl here
			gitHubLink += `&url=${finishUrl}`;
		}
		const oktaLink = `/web/configure-okta?url=${finishUrl}`;
		const oktaEnabled = !!this.api.config.integrations.okta.appClientId;
		this.module.evalTemplate(this, 'login', { 
			error,
			email,
			teamId,
			finishUrl: finishUrl,
			tenantId:  tenantId,
			version: this.module.versionInfo(),
			codeStreamIcon: Icons['codestream'],
			gitHubLink,
			oktaLink,
			gitHubIcon: Icons['github'],
			oktaIcon: Icons['okta'],
			oktaEnabled,
			csrf
		});
	}

	handleError () {
		const { error, errorData } = this.request.query;
		const webError = Object.keys(WebErrors).find(errorType => WebErrors[errorType].code === error);
		const message = webError ? WebErrors[webError].message : WebErrors.internalError.message;
		const template = Handlebars.compile(message);
		let messageData = {};
		if (errorData) {
			try {
				messageData = JSON.parse(decodeURIComponent(errorData));
			}
			catch (error) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				this.warn(`Unable to parse incoming errorData: ${message}`);
			}
		}
		return template(messageData);
	}

}

module.exports = WebLoginRequest;

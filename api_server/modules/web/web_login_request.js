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
		const usePassword = this.request.query.password === 'true' ? true : false;
		const forgotPassword = this.request.query.forgot === 'true' ? true : false;
		const hasBeenReset = this.request.query.hasBeenReset === 'true' ? true : false;
		const invalidEmail = this.request.query.invalidEmail === 'true' ? true : false;
		const email = this.request.query.email ? decodeURIComponent(this.request.query.email) : '';
		const teamId = this.request.query.teamId ? this.request.query.teamId.toLowerCase() : '';
		const error = this.request.query.error ? this.handleError() : '';
		const finishUrl = decodeURIComponent(this.request.query.url || '');
		const tenantId = decodeURIComponent(this.request.query.tenantId || '');
		const src = decodeURIComponent(this.request.query.src || '');
		const links = [];
		['github', 'gitlab', 'bitbucket'].forEach(provider => {
			let link = `/web/provider-auth/${provider}?noSignup=1`;
			if (tenantId) {
				// if you have a tenantId, you cannot redirect elsewhere
				link += `&tenantId=${tenantId}`;
			}
			else if (finishUrl) {
				// since we're not POSTed, we attach the finishUrl here
				link += `&url=${finishUrl}`;
			}
			if (src) {
				link += `&src=${src}`;
			}
			links.push(link);
		});
		const oktaLink = `/web/configure-okta?url=${finishUrl}`;
		const oktaEnabled = !!this.api.config.integrations.okta.appClientId;
		const passwordSwitchLinkQueryObj = {
			...this.request.query,
			password: !usePassword
		};
		const passwordSwitchLinkQuery = Object.keys(passwordSwitchLinkQueryObj)
			.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(passwordSwitchLinkQueryObj[key]))
			.join('&');
		const passwordSwitchLink = `/web/login?${passwordSwitchLinkQuery}`;
		const forgotLinkQueryObj = {
			...this.request.query,
			forgot: true
		}
		const forgotLinkQuery = Object.keys(forgotLinkQueryObj)
			.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(forgotLinkQueryObj[key]))
			.join('&');
		const forgotLink = `/web/login?${forgotLinkQuery}`;

		this.module.evalTemplate(this, 'login', { 
			error,
			email,
			teamId,
			usePassword,
			forgotPassword,
			forgotLink,
			hasBeenReset,
			invalidEmail,
			passwordSwitchLink,
			finishUrl: finishUrl,
			tenantId:  tenantId,
			version: this.module.versionInfo(),
			codeStreamIcon: Icons['codestream'],
			gitHubLink: links[0],
			gitLabLink: links[1],
			bitbucketLink: links[2],
			oktaLink,
			gitHubIcon: Icons['github'],
			gitLabIcon: Icons['gitlab'],
			bitbucketIcon: Icons['bitbucket'],
			oktaIcon: Icons['okta'],
			oktaEnabled,
			csrf,
			src: src,
			segmentKey: this.api.config.telemetry.segment.webToken
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

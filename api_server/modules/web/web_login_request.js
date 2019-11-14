'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const WebErrors = require('./errors');
const Handlebars = require('handlebars');

class WebLoginRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		const csrf = this.request.csrfToken();
		const url = this.request.query.url ? decodeURIComponent(this.request.query.url) : '';
		const email = this.request.query.email ? decodeURIComponent(this.request.query.email) : '';
		const teamId = this.request.query.teamId ? this.request.query.teamId.toLowerCase() : '';
		let linkQuery = `url=${encodeURIComponent(url)}&teamId=${teamId}&access=strict`;
		const preventSignup = false; // set this to true, or just combine this with the above line, when we're ready
		if (preventSignup) {
			linkQuery += '&noSignup=1';
		}
		const slackLink = `/web/provider-auth/slack?${linkQuery}`;
		const msteamsLink = `/web/provider-auth/msteams?${linkQuery}`;
		const error = this.request.query.error ? this.handleError() : '';
		this.module.evalTemplate(this, 'login', { 
			error,
			email,
			teamId,
			finishUrl: decodeURIComponent(this.request.query.url || ''),
			slackLink,
			msteamsLink,
			version: this.module.versionInfo(),
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

'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');
const WebErrors = require('./errors');
const Handlebars = require('handlebars');

class WebConfirmCodeRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		const csrf = this.request.csrfToken();
		const email = this.request.query.email ? decodeURIComponent(this.request.query.email) : '';
		const teamId = this.request.query.teamId ? this.request.query.teamId.toLowerCase() : '';
		const error = this.request.query.error ? this.handleError() : '';
		const finishUrl = decodeURIComponent(this.request.query.finishUrl || '');
		const tenantId = decodeURIComponent(this.request.query.tenantId || '');
		const src = decodeURIComponent(this.request.query.src || '');
		const changeItQueryKeys = [ 'email', 'teamId', 'finishUrl', 'tenantId', 'src' ];
		const changeItQuery = changeItQueryKeys.reduce((value, key) => {
			if (this.request.query[key]) {
				return value + '&' + encodeURIComponent(key) + '=' + encodeURIComponent(this.request.query[key]);
			} else {
				return value;
			}
		}, '');
		const changeItLink = `/web/login?${changeItQuery}`;
		this.module.evalTemplate(this, 'confirm_code', {
			csrf,
			email,
			teamId,
			error,
			finishUrl,
			tenantId,
			src,
			changeItLink
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

module.exports = WebConfirmCodeRequest;

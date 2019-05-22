'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const ProviderDisplayNames = require('./provider_display_names');

class WebErrorRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		const errorCode = decodeURIComponent(this.request.query.code || '');
		const { code, title, body } = this.getSpecialErrorDisplay(errorCode) || {};
		const withProvider = this.request.query.provider && ProviderDisplayNames[this.request.query.provider] ?
			` with ${ProviderDisplayNames[this.request.query.provider]}` :
			'';
		const withCode = errorCode ? ` (error: <b>${errorCode}</b>)` : '';
		this.module.evalTemplate(this, 'error', {
			title: title || 'Authentication failed',
			body: body || `We were not able to authenticate you${withProvider}${withCode}. <a href="mailto:support@codestream.com">Contact support</a> if you need assistance, or return to your IDE to try again.`,
			version: this.module.versionInfo(),
			code: code || ''
		});
	}

	getSpecialErrorDisplay (code) {

		const connectedTeam = this.request.query.provider && ProviderDisplayNames[this.request.query.provider] ?
			`${ProviderDisplayNames[this.request.query.provider]}-connected` :
			'third-party connected';

		switch (code) {
		case 'USRC-1015': 
			return {
				title: 'Multiple Workspaces',
				body: `Unfortunately, at this time, you can only be a member of one ${connectedTeam} team on CodeStream. <a href="mailto:support@codestream.com">Contact support</a> and we'll let you know as soon as support for multiple ${connectedTeam} teams is ready.`
			};
		}
	}
}

module.exports = WebErrorRequest;

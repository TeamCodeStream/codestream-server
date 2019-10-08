'use strict';

const WebRequestBase = require('./web_request_base');
const ProviderDisplayNames = require('./provider_display_names');

class WebErrorRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		const errorCode = decodeURIComponent(this.request.query.code || '');
		const { code, title, body } = this.getSpecialErrorDisplay(errorCode) || {};
		const withProvider = this.request.query.provider && ProviderDisplayNames[this.request.query.provider] ?
			` with ${ProviderDisplayNames[this.request.query.provider]}` :
			'';
		const withCode = errorCode ? ` (error: <b>${errorCode}</b>)` : '';
		return super.render('error', {
			title: title || 'Authentication failed',
			body: body || `We were not able to authenticate you${withProvider}${withCode}. <a href="mailto:support@codestream.com">Contact support</a> if you need assistance, or return to your IDE to try again.`,
			code: code || ''
		});
	}

	getSpecialErrorDisplay(code) {

		const connectedTeam = this.request.query.provider && ProviderDisplayNames[this.request.query.provider] ?
			`${ProviderDisplayNames[this.request.query.provider]}-connected` :
			'third-party connected';

		switch (code) {
		case 'USRC-1015':
			return {
				title: 'Multiple Workspaces',
				body: `Unfortunately, at this time, you can only be a member of one ${connectedTeam} team on CodeStream. <a href="mailto:support@codestream.com">Contact support</a> and we'll let you know as soon as support for multiple ${connectedTeam} teams is ready.`
			};
		
		case 'PRVD-1005':
			return {
				title: 'Account Not Found',
				body: 'Please return to your IDE and sign up.'
			};

		case 'PRVD-1006':
			return {
				title: 'Invalid Credentials',
				body: 'Please return to your IDE and sign in using your email address and CodeStream password.'
			};
		}
	}
}

module.exports = WebErrorRequest;

'use strict';

const WebRequestBase = require('./web_request_base');

class WebConfirmEmailFailedRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		const errorCode = decodeURIComponent(this.request.query.error || '');
		return super.render('error', {
			title: 'Confirmation failed',
			body: `Your request to confirm your new email failed (error code <b>${errorCode}</b>). <a href="mailto:support@codestream.com">Contact support</a> if you need assistance.`
		});
	}
}

module.exports = WebConfirmEmailFailedRequest;

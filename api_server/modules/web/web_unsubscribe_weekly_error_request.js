'use strict';

const WebRequestBase = require('./web_request_base');

class WebUnsubscribeWeeklyErrorRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		const errorCode = decodeURIComponent(this.request.query.error || '');
		return super.render('error', {
			title: 'Request failed',
			body: `Your request to unsubscribe to weekly activity emails failed (error code <b>${errorCode}</b>). <a href="mailto:support@codestream.com">Contact support</a> for assistance.`
		});
	}
}

module.exports = WebUnsubscribeWeeklyErrorRequest;

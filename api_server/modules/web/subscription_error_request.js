'use strict';

const WebRequestBase = require('./web_request_base');

class SubscriptionErrorRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		const errorCode = decodeURIComponent(this.request.query.error || '');
		return super.render('error', {
			title: 'Subscription upgrade failed',
			body: `Your request to upgrade your subscription failed (error code <b>${errorCode}</b>). <a href="mailto:support@codestream.com">Contact support</a> if you need assistance.`
		});
	}
}

module.exports = SubscriptionErrorRequest;

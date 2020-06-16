'use strict';

const WebRequestBase = require('./web_request_base');

class WebFinishRequest extends WebRequestBase {
	async authorize() {
	}
	async process() {		
		const tenantToken = decodeURIComponent(this.request.query.tenantToken || ''); 
		return super.render('finish', {
			tenantToken: tenantToken,
		});
	}
}

module.exports = WebFinishRequest;

'use strict';

const WebRequestBase = require('./web_request_base');

class WebConfigureOktaRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		super.render('configure_okta', this.request.query);
	}
}

module.exports = WebConfigureOktaRequest;

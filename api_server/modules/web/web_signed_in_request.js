'use strict';

const WebRequestBase = require('./web_request_base');

class WebSignedInRequest extends WebRequestBase {

	async authorize () {}

	async process () {
		return super.render('signed_in', { newRelic: true });
	}
}

module.exports = WebSignedInRequest;

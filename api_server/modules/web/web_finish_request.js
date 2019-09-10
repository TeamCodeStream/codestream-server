'use strict';

const WebRequestBase = require('./web_request_base');

class WebFinishRequest extends WebRequestBase {
	async authorize() {
	}
	async process() {
		await super.render('finish');
	}
}

module.exports = WebFinishRequest;

'use strict';

const ProviderPostRequest = require('./provider_post_request');

class SlackPostRequest extends ProviderPostRequest {

	constructor (options) {
		super(options);
		this.request.params.provider = 'slack';
	}
}

module.exports = SlackPostRequest;
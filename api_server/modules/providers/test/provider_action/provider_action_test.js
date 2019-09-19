'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class ProviderActionTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return `should successfully handle a provider action request for ${this.provider}, linkType=${this.linkType}`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return `/no-auth/provider-action/${this.provider}`;
	}

	dontWantToken () {
		return true;
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}
}

module.exports = ProviderActionTest;

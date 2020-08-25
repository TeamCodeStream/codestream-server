// base class for many tests of the "POST /codemark/:id/permalink" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const CommonInit = require('./common_init');

class CodemarkLinkTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		const withMarkers = this.wantMarkers ? ' with markers' : '';
		const codemarkType = this.codemarkType || 'comment';
		return `should return a valid permalink url when creating a ${this.permalinkType} permalink associated with an existing ${codemarkType} codemark${withMarkers}`;
	}

	get method () {
		return 'post';
	}

	getExpectedFields () {
		return ['permalink'];
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const { permalink } = data;
		this.permalink = permalink;
		const type = this.permalinkType === 'public' ? 'p' : 'c';
		const origin = this.apiConfig.apiServer.publicApiUrl.replace(/\//g, '\\/');
		const regex = `^${origin}\\/${type}\\/([A-Za-z0-9_-]+)\\/([A-Za-z0-9_-]+)$`;
		const match = permalink.match(new RegExp(regex));
		Assert(match, `returned permalink "${permalink}" does not match /${regex}/`);

		const teamId = this.decodeLinkId(match[1]);
		Assert.equal(teamId, this.team.id, 'permalink does not contain proper team ID');
	}

	// decode the ID contained within the link
	decodeLinkId (linkId) {
		linkId = linkId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		return Buffer.from(linkId, 'base64').toString('hex');
	}
}

module.exports = CodemarkLinkTest;

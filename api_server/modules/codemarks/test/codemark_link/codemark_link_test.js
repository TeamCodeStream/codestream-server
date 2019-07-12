// base class for many tests of the "POST /codemark/:id/permalink" requests

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const Assert = require('assert');

class CodemarkLinkTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
	}

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
		BoundAsync.series(this, [
			super.before,
			this.createCodemark
		], callback);
	}

	// create the codemark that we'll create a permalink for
	createCodemark (callback) {
		const data = this.codemarkFactory.getRandomCodemarkData({ codemarkType: this.codemarkType });
		if (this.wantMarkers) {
			data.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0].id });
		}
		Object.assign(data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				this.path = `/codemarks/${this.codemark.id}/permalink`;
				if (this.permalinkType === 'public') {
					this.data = { isPublic: true };
				}
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		const { permalink } = data;
		const type = this.permalinkType === 'public' ? 'p' : 'c';
		const origin = ApiConfig.publicApiUrl.replace(/\//g, '\\/');
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

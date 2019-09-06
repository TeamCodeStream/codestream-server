// base class for many tests of the "PUT /codemarks/:id/remove-tag" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
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
		if (this.dontCreatePermalink) {
			data._dontCreatePermalink = true;
		}

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

}

module.exports = CommonInit;

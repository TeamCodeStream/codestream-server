// base class for many tests of the "PUT /markers/:id/move" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeMarkerData		// make the data to be used during the move request
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true,
			markerStreamId: 0,	// will use the existing file stream created for the repo
			commitHash: this.repoFactory.randomCommitHash()
		});
		callback();
	}

	// form the data for the marker update
	makeMarkerData (callback) {
		this.data = this.markerFactory.getRandomMarkerData();
		Object.assign(this.data, {
			file: this.streamFactory.randomFile(),
			remotes: [this.repoFactory.randomUrl()]
		});
		this.modifiedAfter = Date.now();
		this.marker = this.postData[0].markers[0];
		this.codemark = this.postData[0].codemark;
		this.path = `/markers/${this.marker.id}/move`;
		callback();
	}

	// do the actual update
	moveMarker (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/markers/${this.marker.id}/move`,
				data: this.data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.createdMarker = response.markers[0];
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;

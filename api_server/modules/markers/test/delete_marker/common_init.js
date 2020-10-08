// base class for many tests of the "DELETE /markers/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeTestData		// make the data to be used during the delete request
		], callback);
	}

	setTestOptions (callback) {
		this.deletedMarkerIndex = 1;
		this.teamOptions.creatorIndex = this.teamCreatorIndex === undefined ? 1 : this.teamCreatorIndex;
		this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: this.teamCreatorCreatesCodemark ? 1 : (this.otherUserCreatesCodemark ? 2 : 0),
			wantCodemark: true,
			wantMarker: true,
			wantMarkers: 3,
			markerStreamId: 0,	// will use the existing file stream created for the repo
			commitHash: this.repoFactory.randomCommitHash()
		});
		callback();
	}

	// form the data for the marker deletion
	makeTestData (callback) {
		this.modifiedAfter = Date.now();
		this.marker = this.postData[0].markers[this.deletedMarkerIndex];
		this.codemark = this.postData[0].codemark;
		this.path = `/markers/${this.marker.id}`;
		callback();
	}

	// do the actual deletion 
	deleteMarker (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: `/markers/${this.marker.id}`,
				data: this.data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;

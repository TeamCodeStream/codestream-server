// base class for many tests of the "PUT /markers" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeMarkerData		// make the data to be used during the update
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
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
		this.data = {
			commitHashWhenCreated: this.repoFactory.randomCommitHash()
		};
		this.marker = this.marker || this.postData[0].markers[0];
		this.expectedData = {
			marker: {
				_id: this.marker.id,	// DEPRECATE ME
				id: this.marker.id,
				$set: Object.assign(DeepClone(this.data), { 
					version: this.expectedVersion,
					modifiedAt: Date.now()	// placeholder
				}),
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedData.marker.$set.commitHashWhenCreated = this.expectedData.marker.$set.commitHashWhenCreated.toLowerCase();
		this.expectedMarker = DeepClone(this.marker);
		Object.assign(this.expectedMarker, this.expectedData.marker.$set);
		this.modifiedAfter = Date.now();
		this.path = '/markers/' + this.marker.id;
		callback();
	}
}

module.exports = CommonInit;

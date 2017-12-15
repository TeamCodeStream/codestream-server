'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Indexes = require('./indexes');

class GetMarkersRequest extends GetManyRequest {

	authorize (callback) {
		if (!this.request.query.teamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		this.teamId = decodeURIComponent(this.request.query.teamId).toLowerCase();
		if (!this.request.query.streamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'streamId' }));
		}
		this.streamId = decodeURIComponent(this.request.query.streamId).toLowerCase();
		if (this.request.query.commitHash) {
			this.commitHash = decodeURIComponent(this.request.query.commitHash).toLowerCase();
		}
		this.user.authorizeStream(this.streamId, this, (error, stream) => {
			if (error) { return callback(error); }
			if (!stream) {
				return callback(this.errorHandler.error('readAuth'));
			}
			if (stream.get('teamId') !== this.teamId) {
				return callback(this.errorHandler.error('notFound', { info: 'stream' }));
			}
			this.stream = stream;
			process.nextTick(callback);
		});
	}

	process (callback) {
		BoundAsync.series(this, [
			this.fetchMarkerLocations,
			super.process
		], callback);
	}

	fetchMarkerLocations (callback) {
		if (!this.commitHash) {
			return callback();
		}
		let query = {
//			teamId: this.teamId, // will be needed for sharding, but for now, we'll avoid an index here
			_id: `${this.streamId}|${this.commitHash}`
		};
		this.data.markerLocations.getByQuery(
			query,
			(error, markerLocations) => {
				if (error) { return callback(error); }
				if (markerLocations.length === 0) {
					this.responseData.markerLocations = {};
					return callback();
				}
				this.markerLocations = markerLocations[0];
				this.responseData.markerLocations = this.markerLocations.getSanitizedObject();
				callback();
			},
			{
				databaseOptions: {
					hint: { _id: 1 }
				}
			}
		);
	}

	buildQuery () {
		let query = {
			teamId: this.teamId,
			streamId: this.streamId
		};
		if (this.request.query.ids) {
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			if (ids.length > 100) {
				return 'too many IDs';
			}
			query._id = this.data.markers.inQuerySafe(ids);
		}
		return query;
	}

	getQueryOptions () {
		return {
			databaseOptions: {
				hint: Indexes.byStreamId
			}
		};
	}
}

module.exports = GetMarkersRequest;

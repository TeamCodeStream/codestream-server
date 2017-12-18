// handle the "GET /markers" request

'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Indexes = require('./indexes');

class GetMarkersRequest extends GetManyRequest {

	// authorize this request given the current user
	authorize (callback) {
		// must have team ID, stream ID, and commit hash, and the user must have access to the stream
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
				// stream must be owned by the given team, this anticipates sharding where this query
				// may not return a valid stream even if it exists but is not owned by the same team
				return callback(this.errorHandler.error('notFound', { info: 'stream' }));
			}
			this.stream = stream;
			process.nextTick(callback);
		});
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.fetchMarkerLocations, // if the user passes a commit hash, we give them whatever marker locations we have for that commit
			super.process	// do the usual "get-many" processing
		], callback);
	}

	// if the user provides a commit hash, we'll fetch marker locations associated with the markers for the stream,
	// if we can find any
	fetchMarkerLocations (callback) {
		if (!this.commitHash) {
			// no commit hash, so we're just returning markers with no location info
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
					// no marker locations for this commit, oh well
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

	// build the database query to use to fetch the markers
	buildQuery () {
		let query = {
			teamId: this.teamId,
			streamId: this.streamId
		};
		if (this.request.query.ids) {
			// user specified some IDs, so restrict to those IDs
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			if (ids.length > 100) {
				return 'too many IDs';
			}
			query._id = this.data.markers.inQuerySafe(ids);
		}
		return query;
	}

	// get database options to associate with the database fetch request
	getQueryOptions () {
		return {
			databaseOptions: {
				hint: Indexes.byStreamId
			}
		};
	}
}

module.exports = GetMarkersRequest;

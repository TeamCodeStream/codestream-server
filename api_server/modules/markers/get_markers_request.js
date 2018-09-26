// handle the "GET /markers" request to fetch multiple markers

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetMarkersRequest extends GetManyRequest {

	// authorize the request
	async authorize () {
		const info = await this.user.authorizeFromTeamIdAndStreamId(
			this.request.query,
			this,
			{ mustBeFileStream: true }
		);
		Object.assign(this, info);
	}

	// process the request...
	async process () {
		await this.fetchMarkerLocations();	// if the user passes a commit hash, we give them whatever marker locations we have for that commit
		await super.process();				// do the usual "get-many" processing
	}

	// if the user provides a commit hash, we'll fetch marker locations associated with the markers for the stream,
	// if we can find any
	async fetchMarkerLocations () {
		if (!this.request.query.commitHash) {
			// no commit hash, so we're just returning markers with no location info
			return;
		}
		this.commitHash = this.request.query.commitHash.toLowerCase();
		const query = {
			// teamId: this.teamId, // will be needed for sharding, but for now, we'll avoid an index here
			_id: `${this.streamId}|${this.commitHash}`
		};
		const markerLocations = await this.data.markerLocations.getByQuery(
			query,
			{ hint: { _id: 1 } }
		);
		if (markerLocations.length === 0) {
			// no marker locations for this commit, oh well
			this.responseData.markerLocations = {};
			return;
		}
		this.markerLocations = markerLocations[0];
		this.responseData.markerLocations = this.markerLocations.getSanitizedObject();
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
		return { hint: Indexes.byStreamId };
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of markers for a given file (given by stream ID), governed by the query parameters; if a commit hash is specified, will also return marker locations for the fetched markers, for the given commit hash';
		description.access = 'User must be a member of the team that owns the file stream to which the markers belong';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team that owns the file stream for which markers are being fetched>',
			'streamId*': '<ID of the file stream for which markers are being fetched>',
			'commitHash': '<Commit hash for which marker locations should be returned, along with the fetched markers>'
		});
		Object.assign(description.returns.looksLike, {
			markerLocations: '<@@#marker locations object#markerLocations@@>'
		});
		description.errors = description.errors.concat([
			'invalidParameter',
			'parameterRequired'
		]);
		return description;
	}
}

module.exports = GetMarkersRequest;

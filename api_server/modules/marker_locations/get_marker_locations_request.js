// handler for the "GET /marker-locations" request to fetch marker locations for a given stream and commit

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetMarkerLocationsRequest extends RestfulRequest {

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
		await this.require();				// check for required parameters
		await this.findMarkerLocations();	// find marker locations based on team ID, stream ID, and commit
	}

	// these parameters are required for the request
	async require () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['teamId', 'streamId', 'commitHash']
				}
			}
		);
	}

	// find the marker locations according to the input parameters
	async findMarkerLocations () {
		//		let teamId = decodeURIComponent(this.request.query.teamId).toLowerCase();
		const streamId = decodeURIComponent(this.request.query.streamId).toLowerCase();
		const commitHash = decodeURIComponent(this.request.query.commitHash).toLowerCase();
		const query = {
			//			teamId: teamId,	 // will be needed for sharding, but for now, we'll avoiding an index here
			_id: `${streamId}|${commitHash}`
		};
		const markerLocations = await this.data.markerLocations.getByQuery(
			query,
			{
				databaseOptions: {
					hint: { _id: 1 }
				}
			}
		);
		if (markerLocations.length === 0) {
			this.responseData.markerLocations = {};
			return;	// no matching marker locations for this commit, we'll just send an empty response
		}
		this.markerLocations = markerLocations[0];
		this.responseData.markerLocations = this.markerLocations.getSanitizedObject();
		this.responseData.numMarkers = this.stream.get('numMarkers');
	}
}

module.exports = GetMarkerLocationsRequest;

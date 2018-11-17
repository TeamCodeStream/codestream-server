// handler for the "PUT /marker-locations" request to update marker locations for a given stream and commit

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');

class PutMarkerLocationsRequest extends RestfulRequest {

	// authorize the request
	async authorize () {
		const info = await this.user.authorizeFromTeamIdAndStreamId(
			this.request.body,
			this,
			{
				mustBeFileStream: true,
				error: 'updateAuth'
			}
		);
		Object.assign(this, info);
	}

	// process the request...
	async process () {
		await this.require();			// check for required parameters
		await this.validate();			// validate input parameters
		await this.handleLocations();	// handle the locations set (validate and prepare for save and broadcast)
		await this.updateLocations();	// do the actual update
	}

	// these parameters are required for the request
	async require () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'streamId', 'commitHash'],
					object: ['locations']
				}
			}
		);
	}

	// validate the request's input parameters
	async validate () {
		this.commitHash = this.request.body.commitHash.toLowerCase();
		if (Object.keys(this.request.body.locations).length > 1000) {
			throw this.errorHandler.error('validation', { info: 'locations object is too large, please break into pieces of less than 1000 elements'});
		}
	}

	// handle the locations set (validate and prepare for save and broadcast)
	async handleLocations () {
		this.update = {};
		this.publish = {};
		for (let markerId of Object.keys(this.request.body.locations)) {
			await this.handleLocation(markerId);
		}
	}

	// handle a single location array
	async handleLocation (markerId) {
		// validate the marker ID
		if (!this.data.markerLocations.objectIdSafe(markerId)) {
			throw this.errorHandler.error('validation', { info: `${markerId} is not a valid marker ID` });
		}
		// validate the location array, which must conform to a strict format
		const location = this.request.body.locations[markerId];
		const result = MarkerCreator.validateLocation(location);
		if (result) {
			throw this.errorHandler.error('validation', { info: `not a valid location for marker ${markerId}: ${result}` });
		}
		// prepare the data update and the broadcast
		this.update[`locations.${markerId}`] = location;	// for database update
		this.publish[markerId] = location;					// for publishing
	}

	// do the actual update
	async updateLocations () {
		const id = `${this.streamId}|${this.commitHash}`;
		let update = {
			$set: this.update
		};
		update.$set.teamId = this.teamId;
		if (this.isForTesting()) { // special for-testing header for easy wiping of test data
			update.$set._forTesting = true;
		}
		await this.data.markerLocations.updateDirectWhenPersist(
			{ id },
			update,
			{ upsert: true }
		);
	}

	// after processing the request...
	async postProcess () {
		// publish the marker locations update to users in the team
		await this.publishMarkerLocations();
	}

	// publish the marker locations update to users in the team
	async publishMarkerLocations () {
		const channel = 'team-' + this.teamId;
		const message = {
			markerLocations: {
				teamId: this.teamId,
				streamId: this.streamId,
				commitHash: this.commitHash,
				locations: this.publish
			},
			requestId: this.request.id
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish marker locations update message to team ${this.teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'put-marker-locations',
			summary: 'Set some marker locations for a given stream ID and commit hash',
			access: 'User must be in the specified team',
			description: 'When marker locations for a given set of markers, a given file (given by stream ID), and a given commit hash are calculated by the client, the client calls this request to set the marker locations',
			input: {
				summary: 'Specify marker location data in the body',
				looksLike: {
					'teamId*': '<ID of the team owning the file stream>',
					'streamId*': '<ID of the stream>',
					'commitHash*': '<Commit SHA for which marker locations are being set>',
					'locations*': '<A set of locations, given as an object whose keys are marker IDs and whose values are locations coordinates>' 
				}
			},
			returns: 'An empty object',
			publishes: {
				summary: 'Publishes a marker locations object with the updated marker locations to the team channel for the team that owns the file stream',
				looksLike: {
					'markerLocations': '<@@#marker locations object#markerLocations@@>'
				}
			},
			errors: [
				'updateAuth',
				'parameterRequired',
				'validation',
				'invalidParameter'
			]
		};
	}
}

module.exports = PutMarkerLocationsRequest;

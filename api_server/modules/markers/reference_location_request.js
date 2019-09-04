// handle the PUT /markers/:id/reference-location request,
// to add a reference location for a marker

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ReferenceLocationRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		// get the marker, only someone on the team can update it
		this.marker = await this.data.markers.getById(this.request.params.id);
		if (!this.marker) {
			throw this.errorHandler.error('notFound', { info: 'marker' });
		}
		if (!this.user.hasTeam(this.marker.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be on the team that owns the marker '});
		}
		if (!this.marker.get('fileStreamId')) {
			throw this.errorHandler.error('updateAuth', { reason: 'can not update reference locations if marker is not associated with a file stream' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require certain parameters, discard unknown ones
		await this.updateMarker();	// update the marker itself
		await this.updateMarkerLocations();	// update marker locations with the given location
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		this.location = this.request.body.location;
		const result = MarkerCreator.validateLocation(this.location);
		if (result) {
			throw this.errorHandler.error('validation', { info: `invalid location: ${result} ` });
		}
		delete this.request.body.location;

		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['commitHash']
				},
				optional: {
					string: ['branch'],
					object: ['flags']
				}
			}
		);

		this.request.body.commitHash = this.request.body.commitHash.toLowerCase();
	}

	// update the marker, adding to its array of reference locations
	async updateMarker () {
		const op = { 
			$push: {
				referenceLocations: {
					...this.request.body,
					location: this.location
				}
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.markers,
			id: this.marker.id
		}).save(op);
	}

	// update marker locations, adding this location
	async updateMarkerLocations () {
		const id = `${this.marker.get('fileStreamId')}|${this.request.body.commitHash}`.toLowerCase();
		let op = {
			$set: {
				teamId: this.marker.get('teamId'),
				[`locations.${this.marker.id}`]: this.location
			}
		};
		if (this.isForTesting()) { // special for-testing header for easy wiping of test data
			op.$set._forTesting = true;
		}
		await this.data.markerLocations.updateDirectWhenPersist(
			{ id },
			op,
			{ upsert: true }
		);

		this.markerLocations = [{
			teamId: this.marker.get('teamId'),
			streamId: this.marker.get('fileStreamId'),
			commitHash: this.request.body.commitHash,
			locations: {
				[this.marker.id]: this.location
			}
		}];
	}

	// form the response to the request
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { 
			marker: this.updateOp,
			markerLocations: this.markerLocations
		};
		await super.handleResponse();
	}

	// after the marker is updated...
	async postProcess () {
		await this.publishMarker();
	}

	// publish the change in marker data to the team
	async publishMarker () {
		const teamId = this.marker.get('teamId');
		const channel = 'team-' + teamId;
		const message = {
			...this.responseData,
			requestId: this.request.id
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish marker message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'reference-location',
			summary: 'Add a reference location for a marker',
			access: 'User must be a member of the team that owns the marker',
			description: 'Markers can have multiple reference locations, locations that are associated with particular locations of the code per a particular commit hash. This request adds a reference location for the given marker.',
			input: {
				summary: 'Specify the marker ID in the request path, and the location data in the request body',
				looksLike: {
					'commitHash*': '<Commit hash of the reference location>',
					'location*': '<Location coordinates of the reference location>',
					'branch': '<The branch associated with this reference location>',
					'flags': '<Object containing arbitrary information to associate with the reference location>'
				}
			},
			returns: {
				summary: 'A directive indicating how to update the marker, and also to add a marker location',
				looksLike: {
					marker: '<some directive>',
					markerLocations: '<markerLocations update>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the marker',
			errors: [
				'updateAuth',
				'notFound',
				'validation'
			]
		};
	}
}

module.exports = ReferenceLocationRequest;

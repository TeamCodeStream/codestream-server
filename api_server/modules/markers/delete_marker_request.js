// handle the DELETE /markers/:id request,
// to remove a marker from a codemark

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');

class DeleteMarkerRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the codemark for this marker, only the codemark's creator, or an admin, can add a marker
		const markerId = this.request.params.id.toLowerCase();
		this.marker = await this.data.markers.getById(markerId);
		if (!this.marker) {
			throw this.errorHandler.error('notFound', { info: 'marker' });
		}
		if (this.marker.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}
		this.codemark = await this.data.codemarks.getById(this.marker.get('codemarkId'));
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if (!this.user.hasTeam(this.codemark.get('teamId'))) {
			throw this.errorHandler.error('deleteAuth', { reason: 'user must be a member of the team' });
		}
		if (this.user.id === this.codemark.get('creatorId')) {
			return;
		}
		this.team = await this.data.teams.getById(this.codemark.get('teamId'));
		if (!(this.team.get('adminIds') || []).includes(this.user.id)) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the codemark creator or an admin can delete a marker' });
		}
	}

	// handle the response returned to the client
	async handleResponse() {
		if (this.gotError) {
			return super.handleResponse();
		}
		this.responseData = {
			marker: this.deleter.updateOp,
			codemark: this.deleter.updateCodemarkOp
		};
		return super.handleResponse();
	}

	// after the marker is deleted...
	async postProcess () {
		// publish the response data to the team
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
			this.warn(`Could not publish marker delete message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'delete-marker',
			summary: 'Delete a marker from a codemark',
			access: 'User must be the creator of the codemark that owns the marker, or an admin on the team that owns the codemark',
			description: 'Deletes (deactivates) the requested marker, and also removes it from its parent codemark.',
			input: {
				summary: 'Specify the marker ID in the request path'
			},
			returns: {
				summary: 'A directive indicating how to update the marker and its parent codemark',
				looksLike: {
					marker: '<directive to update the marker>',
					codemark: '<directive to update the codemark>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the parent codemark of the marker',
			errors: [
				'deleteAuth',
				'notFound'
			]
		};
	}
}

module.exports = DeleteMarkerRequest;

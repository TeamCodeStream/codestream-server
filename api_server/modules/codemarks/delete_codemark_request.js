// handle the DELETE /codemarks request to delete (deactivate) a codemark,
// along with associated post and markers

'use strict';

const DeleteRequest = require(process.env.CS_API_TOP + '/lib/util/restful/delete_request');
const PostDeleter = require(process.env.CS_API_TOP + '/modules/posts/post_deleter');

class DeleteCodemarkRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the codemark, only the author or the team admin can delete it
		const codemarkId = this.request.params.id.toLowerCase();
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		this.team = await this.data.teams.getById(this.codemark.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });	// really shouldn't happen
		}
		if (
			this.codemark.get('creatorId') !== this.user.id &&
			!(this.team.get('adminIds') || []).includes(this.user.id)
		) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the author or a team admin can delete the codemark' });
		}
	}

	async process () {
		// establish a post deleter here, rather than in the CodemarkDeleter,
		// to avoid a circular require
		this.postDeleter = new PostDeleter({
			request: this,
			dontDeleteCodemark: true
		});
		await super.process();
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// put the deleted post into posts instead
		this.responseData.codemarks = [this.responseData.codemark];
		delete this.responseData.codemark;

		// add any deleted post to the response
		if (this.transforms.deletedPost) {
			this.responseData.posts = this.responseData.posts || [];
			this.responseData.posts.push(this.transforms.deletedPost);
		}

		// add any deleted markers to the response
		if (this.transforms.deletedMarkers) {
			this.responseData.markers = this.transforms.deletedMarkers;
		}
		
		// if a parent post was updated, add that to the response
		if (this.transforms.updatedParentCodemark) {
			this.responseData.codemarks.push(this.transforms.updatedParentCodemark);
		}

		// if a parent post has a codemark that was updated, add that to the response
		if (this.transforms.updatedParentPost) {
			this.responseData.posts = this.responseData.posts || [];
			this.responseData.posts.push(this.transforms.updatedParentPost);
		}

		// if any related codemarks were touched, add that to the response
		if (this.transforms.unrelatedCodemarks) {
			this.responseData.codemarks = [...this.responseData.codemarks, ...this.transforms.unrelatedCodemarks];
		}

		await super.handleResponse();
	}

	// after the codemark is deleted...
	async postProcess () {
		// need the stream for publishing
		if (!this.codemark.get('providerType')) {
			this.stream = await this.data.streams.getById(this.codemark.get('streamId'));
		}
		await this.publishCodemark();
		await this.publishMarkers();
		await this.publishUnrelatedCodemarks();
	}

	// publish the codemark to the appropriate broadcaster channel
	async publishCodemark () {
		const message = Object.assign({}, this.responseData, {
			requestId: this.request.id
		});

		// for third-party codemarks, we have no stream channels, so we have to send
		// the update out over the team channel ... known security flaw, for now
		let channel;
		if (!this.stream || this.stream.get('isTeamStream')) {
			channel = `team-${this.team.id}`;
		}
		else {
			channel = `stream-${this.stream.id}`;
		}
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish codemark delete message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// deleted markers always go out to the team channel, even if they are in a private stream
	async publishMarkers () {
		// we only need to publish markers if the codemark was in a private CodeStream channel,
		// otherwise, the message went out to the team channel anyway
		if (
			!this.responseData.markers ||
			!this.stream ||
			this.stream.get('isTeamStream')
		) {
			return;
		}
		const message = {
			markers: this.responseData.markers,
			requestId: this.request.id
		};
		const channel = `team-${this.team.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish markers message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// any codemarks that were related to this one, but are now unrelated, need to be published
	// to the team channel, if the codemark itself didn't already go out to the team channel
	async publishUnrelatedCodemarks () {
		// we only need to publish these codemarks if the deleted codemark was in a private CodeStream channel,
		// otherwise, the message went out to the team channel anyway
		if (
			!this.transforms.unrelatedCodemarks ||
			!this.stream ||
			this.stream.get('isTeamStream')
		) {
			return;
		}
		const message = {
			codemarks: this.responseData.codemarks,
			requestId: this.request.id
		};
		const channel = `team-${this.team.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish unrelated codemarks message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the creator of the codemark, or an admin';
		description.returns = {
			summary: 'Returns the codemark with a directive to set deactivated flag to true, as well as any associated post or markers',
			looksLike: {
				codemark: {
					id: '<ID of the codemark>',
					$set: {
						deactivated: true
					}
				},
				post: {
					id: '<ID of associated post>',
					$set: {
						deactivated: true
					}
				},
				markers: [{
					id: '<ID of associated marker>',
					$set: {
						deactivated: true
					}
				}]
			}
		};
		description.publishes = 'Same as response, published to the stream that owns the codemark, or the team if third-party provider is used';
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeleteCodemarkRequest;

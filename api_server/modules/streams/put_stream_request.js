// handle the PUT /streams request to update attributes of a stream

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');
const StreamPublisher = require('./stream_publisher');
const StreamSubscriptionGranter = require('./stream_subscription_granter');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');

class PutStreamRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the stream
		const stream = await this.data.streams.getById(this.request.params.id);
		if (!stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
        
		// currently, only channel streams can even be updated
		if (stream.get('type') !== 'channel') {
			throw this.errorHandler.error('updateAuth', { reason: 'only channel streams can be updated' });
		}

		const authorized = await this.request.user.authorizeStream(this.request.params.id, this);
		if (!authorized) {
			throw this.errorHandler.error('updateAuth', { reason: 'only members can update this stream' });
		}
	}

	// after the stream is updated...
	async postProcess () {
		// grant permissions for all added users to subscribe to the stream channel,
		// revoke permissions for all removed users to subscribe to the stream channel
		await awaitParallel([
			this.grantUserMessagingPermissions,
			this.revokeUserMessagingPermissions
		], this);

		// publish the update as needed, and 
		// explicitly publish to any users added to a stream
		await awaitParallel([
			this.publishStream,
			this.publishToUsers,
			this.publishUserUpdates
		], this);
	}
	
	// grant permission to any new members to subscribe to the stream channel
	async grantUserMessagingPermissions () {
		if (!this.transforms.addedUsers || this.transforms.addedUsers.length === 0) {
			return;
		}
		await this.setUserMessagingPermissions(this.transforms.addedUsers);
	}

	// revoke permission to any members removed from the stream to subscribe to the stream channel
	async revokeUserMessagingPermissions () {
		if (!this.transforms.removedUsers || this.transforms.removedUsers.length === 0) {
			return;
		}
		await this.setUserMessagingPermissions(this.transforms.removedUsers, true);
	}

	// grant or revoke permission for any new or removed members to subscribe to the stream channel
	async setUserMessagingPermissions (members, revoke = false) {
		return; // stream channels are now deprecated

		const granterOptions = {
			data: this.data,
			broadcaster: this.api.services.broadcaster,
			stream: this.updater.stream,
			members,
			revoke,
			request: this
		};
		try {
			await new StreamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('streamMessagingGrant', { reason: error });
		}
	}
	
	// publish the stream to the appropriate broadcaster channel
	async publishStream () {
		await new StreamPublisher({
			data: this.responseData,
			request: this,
			broadcaster: this.api.services.broadcaster,
			stream: this.updater.stream.attributes
		}).publishStream();
	}

	// publish the stream to the broadcaster channel for any users that have been added to the stream
	async publishToUsers () {
		const stream = await this.data.streams.getById(this.updater.stream.id);
		// only applies to private streams, and only if there are users added
		if (
			stream.get('privacy') !== 'private' ||
			!this.transforms.addedUsers ||
			this.transforms.addedUsers.length === 0
		) {
			return;	
		}
		const userIds = this.transforms.addedUsers.map(user => user.id);
		await new StreamPublisher({
			data: { stream: stream.getSanitizedObject({ request: this }) },
			request: this,
			broadcaster: this.api.services.broadcaster,
			stream: this.updater.stream.attributes
		}).publishStreamToUsers(userIds);
	}

	// publish any user updates (cleared lastReads for the stream) to the given users
	async publishUserUpdates () {
		const userUpdates = this.transforms.userUpdateOps || [];
		await Promise.all(userUpdates.map(async userUpdate => {
			await this.publishUserUpdate(userUpdate);
		}));
	}

	// publish a user update (cleared lastReads for the stream) to the given user
	async publishUserUpdate (updateOp) {
		const message = {
			user: updateOp,
			requestId: this.request.id
		};
		const channel = `user-${updateOp.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish unreads message to user ${updateOp.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Currently, only channel streams can be updated, and the user must be a member of the channel stream';
		description.input = {
			summary: description.input,
			looksLike: {
				'name': '<Updated name of the channel stream>',
				'purpose': '<Updated purpose of the channel stream>',
				'isArchived': '<If the channel stream is archived>',
				'$push': {
					memberIds: '<Array of IDs representing users to add to the channel stream>'
				},
				'$pull': {
					memberIds: '<Array of IDs representing users to remove from the channel stream>'
				}
			}
		};
		description.publishes = {
			summary: 'If the stream is public to the team, the updated stream object (with possible directives) will be published to the team channel. If the stream is private, the updated stream object will be published to the stream channel for the stream. If users are added, the stream object will also be published to the user channel for all added users. If users are removed, an update to the lastReads for each removed user will be published to the user channel for each removed user. If the stream is archived, an update to the lastReads for each users in the stream will be published to the user channel for each user in the stream.',
			looksLike: {
				stream: '<@@#stream object#stream@@>'
			}
		};
		description.errors = description.errors.concat([
			'duplicateName'
		]);
		return description;
	}
}

module.exports = PutStreamRequest;

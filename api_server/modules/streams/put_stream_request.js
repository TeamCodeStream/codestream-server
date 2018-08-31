// handle the PUT /streams request to update attributes of a stream

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
const StreamPublisher = require('./stream_publisher');
const StreamSubscriptionGranter = require('./stream_subscription_granter');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

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
			this.revokeUserMessagingPermissions,
			this.clearUnreads
		], this);

		// publish the update as needed, and 
		// explicitly publish to any users added to a stream
		await awaitParallel([
			this.publishStream,
			this.publishToUsers
		], this);
	}
	
	// grant permission to any new members to subscribe to the stream channel
	async grantUserMessagingPermissions () {
		if (!this.updater.addedUsers || this.updater.addedUsers.length === 0) {
			return;
		}
		await this.setUserMessagingPermissions();
	}

	// revoke permission to any members removed from the stream to subscribe to the stream channel
	async revokeUserMessagingPermissions () {
		if (!this.updater.removedUsers || this.updater.removedUsers.length === 0) {
			return;
		}
		await this.setUserMessagingPermissions(true);
	}

	// grant or revoke permission for any new or removed members to subscribe to the stream channel
	async setUserMessagingPermissions (revoke = false) {
		const granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			stream: this.updater.stream,
			members: this.updater.addedUsers,
			request: this,
			revoke
		};
		try {
			await new StreamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('streamMessagingGrant', { reason: error });
		}
	}
	
	// publish the stream to the appropriate messager channel
	async publishStream () {
		await new StreamPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: this.updater.stream.attributes
		}).publishStream();
	}

	// publish the stream to the messager channel for any users that have been added to the stream
	async publishToUsers () {
		const stream = this.updater.stream;
		// only applies to private streams, and only if there are users added
		if (
			stream.get('privacy') !== 'private' ||
			!this.updater.addedUsers ||
			this.updater.addedUsers.length === 0
		) {
			return;	
		}
		const userIds = this.updater.addedUsers.map(user => user.id);
		await new StreamPublisher({
			data: { stream: this.updater.stream.getSanitizedObject() },
			request: this,
			messager: this.api.services.messager,
			stream: this.updater.stream.attributes
		}).publishStreamToUsers(userIds);
	}

	// clear the unreads for all relevant users - users removed from the stream, or if the stream
	// was archived, all users in the stream
	async clearUnreads () {
		if (this.updater.wasArchived) {
			// the stream was archived, remove lastUnreads for all users in the stream
			await this.clearUnreadsForAllUsers();
		}
		else if (this.updater.removedUsers && this.updater.removedUsers.length > 0) {
			// certain users were removed, remove lastUnreads for those users only
			const userIds = this.updater.removedUsers.map(user => user.id);
			await this.clearUnreadsForUsers(userIds);
		}
	}
	
	// clear the unreads for all users in the stream, since it was archived
	async clearUnreadsForAllUsers () {
		const stream = this.updater.stream;
		const teamId = stream.get('teamId');
		let memberIds;
		let query = null;
		if (stream.get('isTeamStream')) {
			const team = await this.data.teams.getById(teamId);
			if (!team) {
				return;	// should never happen
			}
			memberIds = team.get('memberIds') || [];
			query = { teamIds: teamId };
		}
		else {
			memberIds = stream.get('memberIds') || [];
		}
		this.clearUnreadsForUsers(memberIds, query);
	}

	// clear the unreads for the given users, and publish a message to each users on their channel
	// the query to be used in the update option can be passed, otherwise it is just all the given users 
	async clearUnreadsForUsers (userIds, query) {
		// update the lastReads for all users, or as given by the query
		const stream = this.updater.stream;
		const op = {
			$unset: {
				[`lastReads.${stream.id}`]: true
			}
		};
		query = query || { _id: this.data.users.inQuerySafe(userIds) };
		await this.data.users.updateDirect(query, op);

		// now publish the message to all users
		await Promise.all(userIds.map(async userId => {
			const message = {
				user: Object.assign({}, op, { _id: userId }),
				requestId: this.request.id
			};
			const channel = `user-${userId}`;
			try {
				await this.api.services.messager.publish(
					message,
					channel,
					{ request: this }
				);
			}
			catch (error) {
				// this doesn't break the chain, but it is unfortunate...
				this.warn(`Could not publish unreads message to user ${userId}: ${JSON.stringify(error)}`);
			}
		}));
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

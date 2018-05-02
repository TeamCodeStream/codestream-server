// handle the PUT /join/:id request to join a public channel

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const StreamPublisher = require('./stream_publisher');
const StreamUpdater = require('./stream_updater');
const StreamSubscriptionGranter = require('./stream_subscription_granter');

class JoinRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		// get the stream
		const stream = await this.data.streams.getById(this.request.params.id);
		if (!stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
        
		// user can only join a public channel
		if (stream.get('privacy') !== 'public') {
			throw this.errorHandler.error('updateAuth', { reason: 'not allowed to join this channel' });
		}
		if (stream.get('type') !== 'channel') {
			throw this.errorHandler.error('updateAuth', { reason: 'only channel streams can be joined' });
		}
		if (stream.get('isTeamStream')) {
			throw this.errorHandler.error('updateAuth', { reason: 'can not join a team stream' });
		}

		// can't join a stream in a team i'm not a member of
		const authorized = await this.user.authorizeTeam(stream.get('teamId'));
		if (!authorized) {
			throw this.errorHandler.error('updateAuth', { reason: 'can not join this stream' });
		}
	}

	// process the request...
	async process () {
		// use the stream updater, and add current user to the stream
		this.updater = new StreamUpdater({
			request: this
		});
		await this.updater.updateModel(
			this.request.params.id,
			{
				$addToSet: { memberIds: this.user.id }
			}
		);
        
		// the updater tells us what the update was, this is exactly what we
		// send to the client
		this.responseData.stream = this.updater.updatedAttributes;
		Object.assign(
			this.responseData,
			this.updater.attachToResponse || {}
		);
	}

	// after the stream is joined...
	async postProcess () {
		await this.grantUserMessagingPermissions();
		await this.publishStream();
	}

	// grant or revoke permission for any new or removed members to subscribe to the stream channel
	async grantUserMessagingPermissions () {
		const granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			stream: this.updater.stream,
			members: [this.user],
			request: this
		};
		try {
			await new StreamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('messagingGrant', { reason: error });
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
}

module.exports = JoinRequest;

// handle the PUT /items request to edit attributes of an item

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');

class PutItemRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the item, only someone on the team can update it
		const item = await this.data.items.getById(this.request.params.id);
		if (!item) {
			throw this.errorHandler.error('notFound', { info: 'item' });
		}
		if (!this.user.hasTeam(item.get('teamId'))) {
			throw this.errorHandler.error('updateAuth');
		}
	}

	// after the item is updated...
	async postProcess () {
		await this.publishItem();
	}

	// publish the item to the appropriate messager channel(s)
	async publishItem () {
		const teamId = this.request.params.id.toLowerCase();
		const channel = 'team-' + teamId;
		const message = {
			item: this.responseData.item,
			requestId: this.request.request.id
		};
		try {
			await this.messager.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish item update message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'User must be a member of the team that owns the item';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId': '<If specified, updates the stream ID the item belongs to>',
				'postId': '<If specified, updates the post ID that points to this item>'
			}
		};
		description.publishes = {
			summary: 'Publishes the updated item attributes to the team channel for the team that owns the item',
			looksLike: {
				'item': '<@@#item object#item@@>'
			}
		};
		return description;
	}
}

module.exports = PutItemRequest;

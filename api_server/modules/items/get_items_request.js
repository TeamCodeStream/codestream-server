// handle the "GET /items" request to fetch multiple knowledge base items

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetItemsRequest extends GetManyRequest {

	// authorize the request
	async authorize () {
		// authorize against the team, this is required
		this.teamId = this.request.query.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		const authorized = await this.user.authorizeTeam(this.teamId, this);
		if (!authorized) {
			throw this.errorHandler.error('createAuth', { reason: 'user not on team' });
		}
	}

	// process the request...
	async process () {
		await super.process();	// do the usual "get-many" processing
		await this.getPosts();	// get associated posts, as needed
		await this.getMarkers();	// get associated markers, as needed
	}

	// build the database query to use to fetch the markers
	buildQuery () {
		const query = {
			teamId: this.teamId
		};
		if (this.request.query.type) {
			query.type = this.request.query.type;
		}
		return query;
	}

	// get database options to associate with the database fetch request
	getQueryOptions () {
		if (this.request.query.type) {
			return { hint: Indexes.byType };
		}
		else {
			return { hint: Indexes.byTeamId };
		}
	}

	// get the posts pointing to the fetched items, as needed
	async getPosts () {
		const postIds = this.models
			.filter(item => !item.get('providerType'))
			.map(item => item.get('postId'));
		if (postIds.length === 0) {
			return;
		}
		const posts = await this.data.posts.getByIds(postIds);
		posts.forEach(post => {
			const item = this.responseData.items.find(item => item.postId === post.id);
			if (item) {
				item.post = post.getSanitizedObject();
			}
		});
	}

	// get the markers associated with the fetched items, as needed
	async getMarkers () {
		const markerIds = this.models.reduce((markerIds, item) => {
			markerIds.push(...(item.get('markerIds') || []));
			return markerIds;
		}, []);
		if (markerIds.length === 0) {
			return;
		}
		const markers = await this.data.markers.getByIds(markerIds);
		markers.forEach(marker => {
			const item = this.responseData.items.find(item => (item.markerIds || []).includes(marker.id));
			if (item) {
				item.markers = item.markers || [];
				item.markers.push(marker.getSanitizedObject());
			}
		});
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of items owned by a team, optionally providing the item type';
		description.access = 'User must be a member of the team';
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the team for which items are being fetched>',
			'type': '<Type of items to fetch>'
		});
		Object.assign(description.returns.looksLike, {
			items: '<@@#item objects#item@@ fetched>'
		});
		description.errors = description.errors.concat([
			'invalidParameter',
			'parameterRequired'
		]);
		return description;
	}
}

module.exports = GetItemsRequest;

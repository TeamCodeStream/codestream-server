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
		if (this.request.query.streamId && this.request.query.type) {
			return 'can not query on streamId and type at the same time';
		}
		const query = {
			teamId: this.teamId
		};
		if (this.request.query.streamId) {
			query.fileStreamId = this.request.query.streamId.toLowerCase();
		}
		if (this.request.query.type) {
			query.type = this.request.query.type;
		}
		let { before, after, inclusive } = this.request.query;
		if (before !== undefined) {
			before = parseInt(before, 10);
			if (!before) {
				return 'before must be a number';
			}
			query.createdAt = query.createdAt || {};
			if (inclusive) {
				query.createdAt.$lte = before;
			}
			else {
				query.createdAt.$lt = before;
			}
		}
		if (after !== undefined) {
			after = parseInt(after, 10);
			if (!after) {
				return 'after must be a number';
			}
			query.createdAt = query.createdAt || {};
			if (inclusive) {
				query.createdAt.$gte = after;
			}
			else {
				query.createdAt.$gt = after;
			}
		}
		return query;
	}

	// get database options to associate with the database fetch request
	getQueryOptions () {
		let hint;
		if (this.request.query.type) {
			hint = Indexes.byType;
		}
		else if (this.request.query.streamId) {
			hint = Indexes.byFileStreamId;
		}
		else {
			hint = Indexes.byTeamId;
		}
		return {
			hint,
			sort: { createdAt: -1 }
		};
	}

	// get the posts pointing to the fetched items, as needed
	async getPosts () {
		const postIds = this.models
			.filter(item => !item.get('providerType'))
			.map(item => item.get('postId'));
		if (postIds.length === 0) {
			return;
		}
		this.posts = await this.data.posts.getByIds(postIds);
		this.responseData.posts = this.posts.map(post => post.getSanitizedObject());
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
		this.markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = this.markers.map(marker => marker.getSanitizedObject());
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

// this class should be used to update post documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const Indexes = require('./indexes');
const PostPublisher = require('./post_publisher');

class PostDeleter extends ModelDeleter {

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	async deletePost (id) {
		return await this.deleteModel(id);
	}

	// completely override the delete method, we will end up deleting
	// not only the post, but the codemark or review it references, along with any
	// markers referenced, and for reviews, all the replies and their codemarks as well
	async delete () {
		await this.getPost();
		this.toDelete = {
			posts: [this.post.id],
			codemarks: [],
			reviews: [],
			markers: []
		};
		this.codemarks = [];

		// collect all the objects to delete before we actually do the operations
		// this includes the referenced codemark (if any) and its markers...
		await this.collectObjectsToDeleteFromPostCodemarks([this.post]);

		// and for reviews, it includes...
		if (this.post.get('reviewId')) {
			// the referenced review and its markers...
			await this.collectObjectsToDeleteFromReview(this.post.get('reviewId'));

			// as well as any replies, their codemarks, and their replies
			await this.collectObjectsToDeleteFromReplies([this.post]);
		}

		// if this is a reply, decrement the numReplies for its parent post, codemark, and review
		await this.updateParents();

		// for any codemarks we are deleting, break the link to related codemarks
		await this.updateRelatedCodemarks();

		// only now, after we've collected all our objects to delete, do we actually do the deletions
		await this.doDeletions();
	}

	// get the post to be deleted
	async getPost () {
		this.post = await this.request.data.posts.getById(this.id);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		if (this.post.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}
	}

	// given an array of posts to delete, collect all the codemarks to delete, and their markers
	async collectObjectsToDeleteFromPostCodemarks (posts) {
		// collect all the codemarks
		const codemarkIds = posts.reduce((arr, post) => {
			if (post.get('codemarkId')) {
				arr.push(post.get('codemarkId'));
			}
			return arr;
		}, []);

		if (codemarkIds.length) {
			this.toDelete.codemarks.push(...codemarkIds);
			const codemarks = await this.data.codemarks.getByIds(codemarkIds);
			this.codemarks.push(...codemarks);

			// collect their markers for deletion
			await this.collectMarkersToDelete(codemarks);
		}
	}

	// for codemarks or reviews (we'll call them thingies, they both have markerIds arrays),
	// collect all the markers for deletion
	async collectMarkersToDelete (thingies) {
		thingies.forEach(thingy => {
			this.toDelete.markers.push(...(thingy.get('markerIds') || []));
		});
	}

	// for a review, collect the review, and all its markers for deletion
	async collectObjectsToDeleteFromReview (reviewId) {
		const review = await this.data.reviews.getById(reviewId);
		this.toDelete.reviews.push(reviewId);
		await this.collectMarkersToDelete([review]);
	}

	// for the replies to a post (for now, this only applies to a post pointing to a review),
	// collect all the replies, their codemarks, and their markers, for deletion 
	async collectObjectsToDeleteFromReplies (posts) {
		// fetch all the replies to these posts
		const postIds = posts.map(post => post.id);
		if (postIds.length === 0) {
			return;
		}
		const replies = await this.data.posts.getByQuery(
			{
				parentPostId: this.data.posts.inQuerySafe(postIds),
				deactivated: false
			},
			{
				hint: Indexes.byParentPostId
			}
		);
		if (replies.length === 0) {
			return;
		}

		// collect these replies for deletion
		const replyIds = replies.map(reply => reply.id);
		this.toDelete.posts.push(...replyIds);

		// collect the codemarks referenced by these replies for deletion
		await this.collectObjectsToDeleteFromPostCodemarks(replies);

		// and collect all the replies to these replies (this should, in theory, only go 1 level deep)
		await this.collectObjectsToDeleteFromReplies(replies);
	}

	// for all codemarks to be deleted, break the link to any related codemarks
	// that are not also being deleted
	async updateRelatedCodemarks () {
		await Promise.all(this.codemarks.map(async codemark => {
			await this.deleteCodemarkRelations(codemark);
		}));
	}
	
	// for a given codemark, delete the relations with any other codemarks
	async deleteCodemarkRelations (codemark) {
		const relatedCodemarkIds = codemark.get('relatedCodemarkIds') || [];
		if (relatedCodemarkIds.length === 0) {
			return;
		}
		this.transforms.unrelatedCodemarks = [];
		await Promise.all(relatedCodemarkIds.map(async relatedCodemarkId => {
			// don't bother if the related codemark is also being deleted
			if (!this.toDelete.codemarks.includes(relatedCodemarkId)) {
				await this.deleteRelation(relatedCodemarkId, codemark.id);
			}
		}));
	}

	// delete the relation from one codemark to the one being deactivated
	async deleteRelation (relatedCodemarkId, codemarkId) {
		const now = Date.now();
		const op = { 
			$pull: { 
				relatedCodemarkIds: codemarkId
			},
			$set: {
				modifiedAt: now
			}
		};
		const updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.codemarks,
			id: relatedCodemarkId
		}).save(op);
		this.transforms.unrelatedCodemarks.push(updateOp);
	}

	// if the post to be deleted is a reply, decrement the parent post's numReplies attribute,
	// and if it references a codemark or review, decrement the numReplies attribute of that as well
	async updateParents () {
		if (!this.post.get('parentPostId')) {
			return;
		}
		const parentPost = await this.data.posts.getById(this.post.get('parentPostId'));
		if (!parentPost) { return; } // sanity, shouldn't happen
		this.transforms.updatedPost = await this.decrementNumReplies(parentPost, 'posts');
		if (parentPost.get('codemarkId')) {
			const codemark = await this.data.codemarks.getById(parentPost.get('codemarkId'));
			if (codemark) {
				this.transforms.updatedCodemark = await this.decrementNumReplies(codemark, 'codemarks');
			}
		}
		if (parentPost.get('reviewId')) {
			const review = await this.data.reviews.getById(parentPost.get('reviewId'));
			if (review) {
				this.transforms.updatedReview = await this.decrementNumReplies(review, 'reviews');
			}
		}
	}

	// decrement the numReplies attribute for a thingy (post, codemark, or review)
	async decrementNumReplies (thingy, collection) {
		const numReplies = thingy.get('numReplies');
		if (!numReplies) { return; }
		const op = {
			$set: {
				numReplies: numReplies - 1,
				modifiedAt: Date.now()
			}
		};
		return await new ModelSaver({
			request: this.request,
			collection: this.request.data[collection],
			id: thingy.id
		}).save(op);
	}

	// perform the deletion of all the objects we've collected
	async doDeletions () {
		const collections = ['posts', 'codemarks', 'reviews', 'markers'];
		await Promise.all(collections.map(async collection => {
			await this.doDeletionsForCollection(collection);
		}));
	}

	// perform the deletion of all the objects within a collection
	async doDeletionsForCollection (collection) {
		if (this.toDelete[collection].length === 0) {
			return;
		}
		this.transforms[`${collection}Deleted`] = [];
		await Promise.all(this.toDelete[collection].map(async id => {
			await this.doDeletionForCollection(collection, id);
		}));
	}

	// perform the deletion of an object, given by ID, within a collection
	async doDeletionForCollection (collection, id) {
		const op = {
			$set: {
				deactivated: true,
				modifiedAt: Date.now()
			}
		};

		// for reviews, with everything being deleted, there will no longer been any replies
		if (this.post.get('reviewId') && collection !== 'markers') {
			op.$set.numReplies = 0;
		}

		// for posts, we replace the post text
		if (collection === 'posts') {
			op.$set.text = 'this post has been deleted';
		}

		// for codemarks, we know a deleted codemark has no relation to any other codemarks
		else if (collection === 'codemarks') {
			op.$set.relatedCodemarkIds = [];
		}

		const updateOp = await new ModelSaver({
			request: this.request,
			collection: this.request.data[collection],
			id
		}).save(op);
		this.transforms[`${collection}Deleted`].push(updateOp);
	}

	// when the request is ready to handle the response, collect all the things
	// and put them into the response
	handleResponse (responseData) {
		// put all our deleted objects in the response
		['posts', 'codemarks', 'reviews', 'markers'].forEach(collection => {
			responseData[collection] = this.transforms[`${collection}Deleted`];
		});

		// if a parent post, codemark, and/or review were touched, put those in the response
		if (this.transforms.updatedPost) {
			responseData.posts.push(this.transforms.updatedPost);
		}
		if (this.transforms.updatedCodemark) {
			responseData.codemarks = responseData.codemarks || [];
			responseData.codemarks.push(this.transforms.updatedCodemark);
		}
		if (this.transforms.updatedReview) {
			responseData.reviews = responseData.reviews || [];
			responseData.reviews.push(this.transforms.updatedReview);
		}

		// if any related codemarks were touched, add that to the response
		if (this.transforms.unrelatedCodemarks) {
			responseData.codemarks.push(...this.transforms.unrelatedCodemarks);
		}
	}

	// after the post is deleted...
	async postProcess () {
		// need the stream for publishing
		this.stream = await this.data.streams.getById(this.post.get('streamId'));
		this.responseData = this.request.responseData;
		await this.publishPost();
		await this.publishMarkers();
		await this.publishUnrelatedCodemarks();
	}

	// publish the post and all other deletions to the appropriate broadcaster channel
	async publishPost () {
		await new PostPublisher({
			data: this.responseData,
			request: this.request,
			broadcaster: this.api.services.broadcaster,
			stream: this.stream.attributes
		}).publishPost();
	}

	// deleted markers always go out to the team channel, even if they are in a private stream
	async publishMarkers () {
		if (!this.responseData.markers || this.stream.get('isTeamStream')) {
			return;
		}
		const message = {
			markers: this.responseData.markers,
			requestId: this.request.request.id
		};
		const channel = `team-${this.post.get('teamId')}`;
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

	// any codemarks that were related to the codemark owend by this post, but are now unrelated, need to be published
	// to the team channel, if the codemark itself didn't already go out to the team channel
	async publishUnrelatedCodemarks () {
		// we only need to publish these codemarks if the deleted codemark was in a private CodeStream channel,
		// otherwise, the message went out to the team channel anyway
		if (
			!this.transforms.unrelatedCodemarks ||
			this.stream.get('isTeamStream')
		) {
			return;
		}
		const message = {
			codemarks: this.transforms.unrelatedCodemarks,
			requestId: this.request.request.id
		};
		const channel = `team-${this.post.get('teamId')}`;
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
}

module.exports = PostDeleter;

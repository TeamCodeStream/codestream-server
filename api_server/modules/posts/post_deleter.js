// this class should be used to update post documents in the database

'use strict';

const ModelDeleter = require(process.env.CS_API_TOP + '/lib/util/restful/model_deleter');
const MarkerDeleter = require(process.env.CS_API_TOP + '/modules/markers/marker_deleter');
const Post = require('./post');

class PostDeleter extends ModelDeleter {

	get modelClass () {
		return Post;    // class to use to create a post model
	}

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	async deletePost (id) {
		return await this.deleteModel(id);
	}

	// set the actual attributes for deletion
	setAttributesForDelete (id) {
		// wipe out the text and replace with something generic
		super.setAttributesForDelete(id);
		this.attributes.text = 'this post has been deleted';
	}

	// called before the delete is actually deleted
	async preDelete () {
		await this.getPost();			// get the post
		await this.deleteMarkers();		// delete any associated markers
		await this.getParentPost();		// get the parent post (if this is a reply)
		await this.updateNumComments();	// update numComments field in a parent marker, if needed
		this.addEditToHistory();		// add this deactivation to the maintained history of edits
		await super.preDelete();		// base-class preDelete
	}

	// get the post
	async getPost () {
		this.post = await this.request.data.posts.getById(this.attributes._id);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		if (this.post.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}
	}

	// delete any associated markers
	async deleteMarkers () {
		const codeBlocks = this.post.get('codeBlocks') || [];
		const markerIds = codeBlocks.map(codeBlock => codeBlock.markerId);
		await Promise.all(markerIds.map(async markerId => {
			await this.deleteMarker(markerId);
		}));
	}

	// delete a single associated marker
	async deleteMarker (markerId) {
		this.markerDeleter = new MarkerDeleter({
			request: this.request
		});
		const markerUpdate = await this.markerDeleter.deleteMarker(markerId);
		this.attachToResponse.markers = this.attachToResponse.markers || [];
		this.attachToResponse.markers.push(markerUpdate);
	}

	// get the parent post, if the deleted post is a reply
	async getParentPost () {
		if (!this.post.get('parentPostId')) {
			return;
		}
		this.parentPost = await this.request.data.posts.getById(
			this.post.get('parentPostId')
		);
	}

	// if the deleted post is a reply to a post with code block(s),
	// update the numComments attribute of the associated marker(s)
	async updateNumComments () {
		if (!this.parentPost || !(this.parentPost.get('codeBlocks') instanceof Array)) {
			return;
		}
		const markerIds = this.parentPost.get('codeBlocks').map(codeBlock => codeBlock.markerId);
		this.attachToResponse.markers = [];
		await Promise.all(markerIds.map(async markerId => {
			await this.updateNumCommentsForMarker(markerId);
		}));
	}

	// if the deleted post is a reply to a post with code block(s),
	// update the numComments attribute of the given marker
	async updateNumCommentsForMarker (markerId) {
		if (!markerId) { return; }
		// update the database, and also save the marker op for publishing to clients
		const op = { $inc: { numComments: -1 } };
		const marker = Object.assign({}, { _id: markerId }, op);
		this.attachToResponse.markers.push(marker);
		await this.request.data.markers.applyOpById(markerId, op);
	}

	// add an edit to the maintained history of edits
	addEditToHistory () {
		this.attributes.editHistory = this.post.get('editHistory') || [];
		this.attributes.editHistory.push({
			editorId: this.request.user.id,
			editedAt: Date.now(),
			previousAttributes: {
				deactivated: false
			}
		});
	}
}

module.exports = PostDeleter;

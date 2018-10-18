// this class should be used to update post documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Post = require('./post');

class PostUpdater extends ModelUpdater {

	get modelClass () {
		return Post;	// class to use to create a post model
	}

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	async updatePost (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['text'],
			'array(string)': ['mentionedUserIds']
		};
	}

	// called before the post is actually saved
	async preSave () {
		await this.getPost();           // get the post
		await this.getStream();       	// get the stream the post is in
		await this.addEditToHistory();  // add this edit to the maintained history of edits
		this.attributes.modifiedAt = Date.now();
		await super.preSave();			// base-class preSave
	}

	// get the post
	async getPost () {
		this.post = await this.request.data.posts.getById(this.attributes._id);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
	}

	// get the stream the post is in
	async getStream () {
		this.stream = await this.request.data.streams.getById(this.post.get('streamId'));
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });   // really shouldn't happen
		}
	}

	// add an edit to the maintained history of edits
	async addEditToHistory () {
		this.attributes.hasBeenEdited = true;
		const edit = {
			editorId: this.request.user.id,
			editedAt: Date.now(),
			previousAttributes: {
				text: this.post.get('text')
			},
			setAttributes: {
				text: this.attributes.text
			}
		};
		if (this.attributes.mentionedUserIds) {
			edit.previousAttributes.mentionedUserIds = this.post.get('mentionedUserIds');
			edit.setAttributes.mentionedUserIds = this.attributes.mentionedUserIds;
		}
		this.attributes.$push = this.attributes.$push || {};
		this.attributes.$push.editHistory = edit;
	}

	async postSave () {
		// have to clean the editHistory part of the update op out, this does not 
		// get sent back in the response to clients
		if (this.updateOp.$push && this.updateOp.$push.editHistory) {
			delete this.updateOp.$push.editHistory;
			if (Object.keys(this.updateOp.$push).length === 0) {
				delete this.updateOp.$push;
			}
		}
		await super.postSave();
	}
}

module.exports = PostUpdater;

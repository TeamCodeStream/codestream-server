// this class should be used to update codemark documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Codemark = require('./codemark');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodemarkHelper = require('./codemark_helper');

class CodemarkUpdater extends ModelUpdater {

	constructor (options) {
		super(options);
		this.codemarkHelper = new CodemarkHelper({ request: this.request });
	}

	get modelClass () {
		return Codemark;	// class to use to create a codemark model
	}

	get collectionName () {
		return 'codemarks';	// data collection to use
	}

	// convenience wrapper
	async updateCodemark (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['postId', 'streamId', 'parentPostId', 'status', 'text', 'title', 'color', 'externalProvider', 'externalProviderHost', 'externalProviderUrl'],
			object: ['remoteCodeUrl', 'threadUrl'],
			'array(string)': ['assignees', 'tags', 'relatedCodemarkIds'],
			'array(object)': ['externalAssignees']
		};
	}

	// called before the codemark is actually saved
	async preSave () {
		// get the codemark
		await this.getCodemark();	
		
		// get the codemark's team
		await this.getTeam();	

		// if providing post ID, we assume it is a pre-created codemark for third-party
		// integration, which requires special treatment
		if (this.attributes.postId) {
			await this.validatePostId();
			await this.updateMarkers();
			await this.updatePost();
		}
		else if (this.attributes.streamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'postId' });	// can only set streamId with postId
		}

		// can only update parentPostId for third-party
		if (this.attributes.parentPostId && !this.codemark.get('providerType')) {
			delete this.attributes.parentPostId;
		}

		// pre-validate the incoming attributes before saving
		await this.preValidate();

		// validate any provided tags
		await this.codemarkHelper.validateTags(this.attributes.tags, this.team);

		// if there is a color, that comes from an older version of the extension, 
		// and should be made into a tag
		if (this.attributes.color && !this.attributes.tags) {
			this.attributes.tags = [`_${this.attributes.color}`];	// assume this is the ID we want to use
		}

		// link or unlink related codemarks to this one
		await this.codemarkHelper.changeCodemarkRelations(this.codemark.attributes, this.attributes, this.team.id);

		// validate any assignees, for issues
		await this.codemarkHelper.validateAssignees(this.codemark.attributes, this.attributes, { team: this.team });

		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}

	// get the codemark
	async getCodemark () {
		this.codemark = await this.request.data.codemarks.getById(this.attributes.id);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
	}

	// get the codemark's team
	async getTeam () {
		this.team = await this.request.data.teams.getById(this.codemark.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// validate the operation
	async validatePostId () {
		if (this.codemark.get('postId')) {
			throw this.errorHandler.error('validation', { info: 'codemark already has a post ID' });
		}

		/*
		if (!this.codemark.get('providerType')) {
			throw this.errorHandler.error('validation', { info: 'can not set postId if codemark is has no providerType' });
		}
		if (!this.attributes.streamId || !this.attributes.postId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId and postId' });
		}
		*/

		// if this is a CodeStream post (no third-party provider), make sure it's a valid post,
		// and ignore any given value of the streamId, we'll use the post's streamId
		if (!this.codemark.get('providerType')) {
			this.post = await this.data.posts.getById(this.attributes.postId);
			if (!this.post || this.post.get('deactivated')) {
				throw this.errorHandler.error('notFound', { info: 'post' });
			}
			else if (this.post.get('teamId') !== this.team.id) {
				throw this.errorHandler.error('updateAuth', { reason: 'linked post must be for the same team' });
			}
			this.attributes.streamId = this.post.get('streamId');
		}
		else if (!this.attributes.streamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
	}

	// if postID and stream ID are being set, set them on any referenced markers as well
	async updateMarkers () {
		if (!this.codemark.get('markerIds')) {
			return;
		}
		this.transforms.markerUpdates = [];
		this.markers = await this.request.data.markers.getByIds(this.codemark.get('markerIds'));
		await Promise.all(this.markers.map(async marker => {
			await this.updateMarker(marker);
		}));
	}

	// update a marker with post ID and stream ID
	async updateMarker (marker) {
		const op = {
			$set: {
				postStreamId: this.attributes.streamId,
				postId: this.attributes.postId,
				modifiedAt: Date.now()
			}
		};
		const markerUpdate = await new ModelSaver({
			request: this.request,
			collection: this.request.data.markers,
			id: marker.id
		}).save(op);
		this.transforms.markerUpdates.push(markerUpdate);
	}

	// for codemarks not on teams associated with third-party providers,
	// if we are setting the post ID, it is for a CodeStream post ...
	// therefore, we need to update the post
	async updatePost () {
		if (!this.post) { return; }
		const op = {
			$set: {
				codemarkId: this.codemark.id,
				modifiedAt: Date.now()
			}
		};
		this.transforms.postUpdate = await new ModelSaver({
			request: this.request,
			collection: this.request.data.posts,
			id: this.attributes.postId
		}).save(op);
	}

	// pre-validate the incoming attributes before saving
	async preValidate () {
		// since validation is dependent on the type of codemark, we can't let the
		// generic ModelUpdater do the full validation, so create a temporary model
		// and run the validation against that
		const tempAttributes = DeepClone(this.codemark.attributes);
		Object.assign(tempAttributes, this.attributes);
		const tempModel = new Codemark(tempAttributes);
		try {
			await tempModel.preSave();
		}
		catch (error) {
			throw this.request.errorHandler.error('validation', { info: error });
		}
	}
}

module.exports = CodemarkUpdater;

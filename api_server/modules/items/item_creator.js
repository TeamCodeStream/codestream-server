// this class should be used to create all item documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Item = require('./item');
const Post = require(process.env.CS_API_TOP + '/modules/posts/post');
const PostAttributes = require(process.env.CS_API_TOP + '/modules/posts/post_attributes');
const CodeBlockHandler = require(process.env.CS_API_TOP + '/modules/posts/code_block_handler');

class ItemCreator extends ModelCreator {

	get modelClass () {
		return Item;	// class to use to create an item model
	}

	get collectionName () {
		return 'items';	// data collection to use
	}

	// convenience wrapper
	async createItem (attributes) {
		return await this.createModel(attributes);
	}

	// normalize post creation operation (pre-save)
	async normalize () {
		// if we have code blocks, preemptively make sure they are valid, 
		// we are strict about code blocks, and don't let them just get dropped if
		// they aren't correct
		if (this.attributes.codeBlocks) {
			await this.validateCodeBlocks();
		}
	}

	// validate the code blocks sent with the post creation
	async validateCodeBlocks () {
		// must be an array of objects
		const result = new Post().validator.validateArrayOfObjects(
			this.attributes.codeBlocks,
			PostAttributes.codeBlocks
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `codeBlocks: ${result}` });
		}
	}

	// these attributes are required or optional to create an item document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'type']
			},
			optional: {
				string: ['postId', 'streamId', 'providerType', 'type', 'status', 'color', 'title', 'text'],
				'array(object)': ['codeBlocks'],
				'array(string)': ['assignees']
			}
		};
	}

	// right before the document is saved...
	async preSave () {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.attributes.creatorId = this.request.user.id;
		await this.getTeam();
		await this.handleCodeBlocks();
		await super.preSave();					// proceed with the save...
	}

	// get the team 
	async getTeam () {
		this.team = await this.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	
	}

	// handle any code blocks tied to the post
	async handleCodeBlocks () {
		if (!this.attributes.codeBlocks) {
			return;
		}
		this.transforms.createdRepos = [];
		this.transforms.repoUpdates = [];
		this.transforms.createdStreamsForCodeBlocks = [];
		this.transforms.createdMarkers = [];
		this.transforms.markerLocations = [];
		await Promise.all(this.attributes.codeBlocks.map(async codeBlock => {
			await this.handleCodeBlock(codeBlock);
		}));
		this.attributes.markerIds = this.transforms.createdMarkers.map(marker => marker.id);
		delete this.attributes.codeBlocks;
	}

	// handle a single code block attached to the post
	async handleCodeBlock (codeBlock) {
		// handle the code block itself separately
		const codeBlockInfo = await new CodeBlockHandler({
			codeBlock,
			request: this.request,
			team: this.team,
			postStreamId: this.attributes.streamId,
			itemId: this.attributes._id,
		}).handleCodeBlock();
		// as a "side effect", this may have created any number of things, like a new repo, new stream, etc.
		// we'll track these things and attach them to the request response later, and also possibly publish
		// them on pubnub channels
		if (codeBlockInfo.createdRepo) {
			this.transforms.createdRepos.push(codeBlockInfo.createdRepo);
		}
		if (codeBlockInfo.repoUpdate) {
			this.transforms.repoUpdates.push(codeBlockInfo.repoUpdate);
		}
		if (codeBlockInfo.createdStream) {
			this.transforms.createdStreamsForCodeBlocks.push(codeBlockInfo.createdStream);
		}
		if (codeBlockInfo.createdMarker) {
			this.transforms.createdMarkers.push(codeBlockInfo.createdMarker);
		}
		if (codeBlockInfo.markerLocation) {
			// marker locations are special, they can be collapsed as long as the marker locations
			// structure refers to the same stream and commit hash
			const markerLocations = this.transforms.markerLocations.find(markerLocations => {
				return (
					markerLocations.streamId === codeBlockInfo.markerLocation.streamId &&
					markerLocations.commitHash === codeBlockInfo.markerLocation.commitHash
				);
			});
			if (markerLocations) {
				Object.assign(markerLocations.locations, codeBlockInfo.markerLocation.locations);
			}
			else {
				this.transforms.markerLocations.push(codeBlockInfo.markerLocation);
			}
		}
	}
}

module.exports = ItemCreator;

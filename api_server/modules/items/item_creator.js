// this class should be used to create all item documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Item = require('./item');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');

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
		// if we have markers, preemptively make sure they are valid, 
		// we are strict about markers, and don't let them just get dropped if
		// they aren't correct
		if (this.attributes.markers) {
			await this.validateMarkers();
		}
	}

	// validate the markers sent with the post creation, this is too important to just drop,
	// so we return an error instead
	async validateMarkers () {
		const result = new Item().validator.validateArrayOfObjects(
			this.attributes.markers,
			{
				type: 'array(object)',
				maxLength: 10,
				maxObjectLength: 10000
			}
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `markers: ${result}` });
		}
	}

	// these attributes are required or optional to create an item document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'type']
			},
			optional: {
				string: ['postId', 'streamId', 'providerType', 'status', 'color', 'title', 'text'],
				'array(object)': ['markers'],
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
		this.createId();	 		// pre-allocate an ID
		await this.getTeam();		// get the team that will own this item
		await this.handleMarkers();	// handle any associated markers
		await super.preSave();		// proceed with the save...
	}

	// get the team that will own this item
	async getTeam () {
		this.team = await this.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	
	}

	// handle any markers tied to the item
	async handleMarkers () {
		if (!this.attributes.markers) {
			return;
		}
		await Promise.all(this.attributes.markers.map(async marker => {
			await this.handleMarker(marker);
		}));
		this.attributes.markerIds = this.transforms.createdMarkers.map(marker => marker.id);
		this.attributes.fileStreamIds = this.transforms.createdMarkers.map(marker => (marker.get('fileStreamId') || null));
		delete this.attributes.markers;
	}

	// handle a single marker attached to the item
	async handleMarker (markerInfo) {
		// handle the marker itself separately
		Object.assign(markerInfo, {
			teamId: this.team.id,
			postStreamId: this.attributes.streamId,
			postId: this.attributes.postId
		});
		if (this.attributes.providerType) {
			markerInfo.providerType = this.attributes.providerType;
		}
		const marker = await new MarkerCreator({
			request: this.request,
			itemId: this.attributes._id
		}).createMarker(markerInfo);
		this.transforms.createdMarkers = this.transforms.createdMarkers || [];
		this.transforms.createdMarkers.push(marker);
	}
}

module.exports = ItemCreator;

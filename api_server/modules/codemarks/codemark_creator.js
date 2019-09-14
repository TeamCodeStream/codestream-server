// this class should be used to create all codemark documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Codemark = require('./codemark');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');
const CodemarkTypes = require('./codemark_types');
const CodemarkLinkCreator = require('./codemark_link_creator');
const CodemarkHelper = require('./codemark_helper');

class CodemarkCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.codemarkHelper = new CodemarkHelper({ request: this });
	}

	get modelClass () {
		return Codemark;	// class to use to create an codemark model
	}

	get collectionName () {
		return 'codemarks';	// data collection to use
	}

	// convenience wrapper
	async createCodemark (attributes) {
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
		
		// if we have url container objects, validate them
		this.validateUrlObject('remoteCodeUrl');
		this.validateUrlObject('threadUrl');
	}

	// validate the markers sent with the codemark creation, this is too important to just drop,
	// so we return an error instead
	async validateMarkers () {
		const result = new Codemark().validator.validateArrayOfObjects(
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

	// validate a url container object, really just restricting it to a name and a url, for now
	validateUrlObject (objectName) {
		const { urlObject } = this.attributes;
		if (!urlObject) return;
		const { name, url } = urlObject;
		if (!name || typeof name !== 'string' || !url || typeof url !== 'string') {
			throw this.errorHandler.error('validation', { info: `${objectName}: name and url are required and must be strings` } );
		}
		this.attributes[objectName] = { name, url };
	}

	// these attributes are required or optional to create an codemark document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'type']
			},
			optional: {
				boolean: ['_dontCreatePermalink'],
				string: ['postId', 'streamId', 'parentPostId', 'providerType', 'status', 'color', 'title', 'text', 'externalProvider', 'externalProviderHost', 'externalProviderUrl', 'createPermalink'],
				object: ['remoteCodeUrl', 'threadUrl'],
				'array(object)': ['markers', 'externalAssignees'],
				'array(string)': ['assignees', 'relatedCodemarkIds', 'tags']
			}
		};
	}

	// right before the document is saved...
	async preSave () {
		// special for-testing header for easy wiping of test data
		if (this.request.isForTesting()) {
			this.attributes._forTesting = true;
		}

		// establish some default attributes
		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
		this.attributes.creatorId = this.request.user.id;
		if (CodemarkTypes.INVISIBLE_TYPES.includes(this.attributes.type)) {
			this.attributes.invisible = true;
		}

		// are we requesting a permalink? really just need to know if a public permalink is requested
		this.permalinkType = this.attributes.createPermalink;
		delete this.attributes.createPermalink;

		// this is just for testing
		this.dontCreatePermalink = this.attributes._dontCreatePermalink;
		delete this.attributes._dontCreatePermalink;

		// pre-allocate an ID
		this.createId();
		
		// get the team that will own this codemark
		await this.getTeam();

		// if we have tags, make sure they are all valid
		await this.codemarkHelper.validateTags(this.attributes.tags, this.team);

		// if there is a color, that comes from an older version of the extension, 
		// and should be made into a tag
		if (this.attributes.color && !this.attributes.tags) {
			this.attributes.tags = [`_${this.attributes.color}`];	// assume this is the ID we want to use
		}

		// for link-type codemarks, we do a "trial run" of creating the markers ... this is because
		// we need the logic that associates code blocks with repos and file streams, but we don't
		// actuallly want to create the markers yet, in case we already have a duplicate codemark
		this.trialRun = this.attributes.type === 'link';
		await this.handleMarkers();	// handle any associated markers

		// now look for an existing codemark as needed
		if (await this.findExisting()) {
			return;
		}

		// if we did a trial run looking for an existing codemark, but didn't find one, 
		// now create the markers for real
		if (this.trialRun) {
			this.trialRun = false;
			await this.handleMarkers();
		}

		// link or unlink related codemarks to this one
		await this.codemarkHelper.changeCodemarkRelations({}, this.attributes, this.team.id);

		// validate assignees, for issues
		await this.codemarkHelper.validateAssignees({}, this.attributes);

		// create a permalink to this codemark, as needed
		if (!this.dontCreatePermalink) {
			await this.createPermalink();
		}

		// proceed with the save...
		await super.preSave();
	}

	// get the team that will own this codemark
	async getTeam () {
		this.team = await this.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	
	}

	// handle any markers tied to the codemark
	async handleMarkers () {
		if (!this.attributes.markers || !this.attributes.markers.length) {
			return;
		}
		if (this.trialRun) {
			this.trialRunMarkers = [];
		}
		await Promise.all(this.attributes.markers.map(async marker => {
			await this.handleMarker(marker);
		}));
		if (!this.trialRun) {
			this.attributes.markerIds = this.transforms.createdMarkers.map(marker => marker.id);
			this.attributes.fileStreamIds = this.transforms.createdMarkers.map(marker => (marker.get('fileStreamId') || null));
			delete this.attributes.markers;
		}
	}

	// handle a single marker attached to the codemark
	async handleMarker (markerInfo) {
		// handle the marker itself separately
		Object.assign(markerInfo, {
			teamId: this.team.id
		});
		if (this.attributes.providerType) {
			markerInfo.providerType = this.attributes.providerType;
		}
		if (this.attributes.streamId) {
			markerInfo.postStreamId = this.attributes.streamId;
		}
		if (this.attributes.postId) {
			markerInfo.postId = this.attributes.postId;
		}
		const marker = await new MarkerCreator({
			request: this.request,
			codemarkId: this.attributes.id,
			trialRun: this.trialRun // indicates not to create the marker for real
		}).createMarker(markerInfo);
		if (this.trialRun) {
			this.trialRunMarkers.push(marker);
		}
		else {
			this.transforms.createdMarkers = this.transforms.createdMarkers || [];
			this.transforms.createdMarkers.push(marker);
		}
	}

	// create a permalink url to the codemark
	async createPermalink () {
		if (this.existingPermalink) {
			this.attributes.permalink = this.existingPermalink;
		}
		else {
			this.attributes.permalink = await new CodemarkLinkCreator({
				request: this.request,
				codemark: this.attributes,
				markers: this.transforms.createdMarkers || [],
				isPublic: this.permalinkType === 'public'
			}).createCodemarkLink();
		}
		this.transforms.permalink = this.attributes.permalink;
	}

	// find an existing codemark that exactly matches this one, only for link-type codemarks
	// this saves us from creating duplicate codemarks when all we are interested in is a permalink
	async findExisting () {
		// only find existing codemarks for link-types
		if (this.attributes.type !== 'link') {
			return;
		}
		const info = await new CodemarkLinkCreator({
			request: this.request
		}).findCodemarkLink(
			this.attributes,
			this.trialRunMarkers || this.transforms.createdMarkers,
			this.permalinkType === 'public'
		);

		if (info) {
			this.existingModel = this.model = info.codemark;
			this.existingPermalink = info.url;
			return true;
		}
	}
}

module.exports = CodemarkCreator;

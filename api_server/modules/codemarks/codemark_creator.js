// this class should be used to create all codemark documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Codemark = require('./codemark');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');
const CodemarkTypes = require('./codemark_types');
const CodemarkLinkCreator = require('./codemark_link_creator');

class CodemarkCreator extends ModelCreator {

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

	// validate the markers sent with the post creation, this is too important to just drop,
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
				string: ['postId', 'streamId', 'parentPostId', 'providerType', 'status', 'color', 'title', 'text', 'externalProvider', 'externalProviderHost', 'externalProviderUrl', 'createPermalink'],
				object: ['remoteCodeUrl', 'threadUrl'],
				'array(object)': ['markers', 'externalAssignees'],
				'array(string)': ['assignees']
			}
		};
	}

	// right before the document is saved...
	async preSave () {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}

		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
		this.attributes.creatorId = this.request.user.id;
		if (CodemarkTypes.INVISIBLE_TYPES.includes(this.attributes.type)) {
			this.attributes.invisible = true;
		}

		this.makeLink = this.attributes.createPermalink;
		delete this.attributes.createPermalink;

		this.createId();	 		// pre-allocate an ID
		await this.getTeam();		// get the team that will own this codemark

		// for link-type codemarks, we do a "trial run" of creating the markers ... this is because
		// we need the logic that associates code blocks with repos and file streams, but we don't
		// actuallly want to create the markers yet, in case we already have a duplicate codemark
		this.trialRun = this.makeLink && this.attributes.type === 'link';
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

		await this.validateAssignees();	// validate the assignees (for issues)
		await super.preSave();		// proceed with the save...
	}

	// right after the document is saved...
	async postSave () {
		if (!this.makeLink) { return; }
		if (this.existingModel) {
			// found an existing codemark that matches this one, so just return 
			// the existing permalink
			this.transforms.permalink = this.existingPermalink;
		}
		else {
			// create a permalink to the codemark, if asked			
			await this.createCodemarkLink();	
		}
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
		if (!this.attributes.markers) {
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

	// if this is an issue, validate the assignees ... all users must be on the team
	async validateAssignees () {
		if (this.attributes.type !== 'issue') {
			// assignees only valid for issues
			delete this.attributes.assignees;
			delete this.attributes.externalAssignees;
			return;
		}
		else if (this.attributes.providerType || !this.attributes.assignees) {
			// if using a third-party provider, we don't care what goes in there
			return;
		}

		const users = await this.data.users.getByIds(
			this.attributes.assignees,
			{
				fields: ['id', 'teamIds'],
				noCache: true
			}
		);
		const teamId = this.team.id;
		if (
			users.length !== this.attributes.assignees.length ||
			users.find(user => !user.hasTeam(teamId))
		) {
			throw this.errorHandler.error('validation', { info: 'assignees must contain only users on the team' });
		}
	}

	// create a link to the codemark, if asked
	async createCodemarkLink () {
		if (!this.makeLink) {
			return;
		}
		this.transforms.permalink = await new CodemarkLinkCreator({
			request: this.request,
			codemark: this.model,
			markers: this.transforms.createdMarkers || [],
			isPublic: this.makeLink === 'public'
		}).createCodemarkLink();
	}

	// find an existing codemark that exactly matches this one, only for link-type codemarks
	// this saves us from creating duplicate codemarks when all we are interested in is a permalink
	async findExisting () {
		if (!this.makeLink || !this.attributes.type === 'link') {
			// don't care if we're not interested in a straight permalink type
			return;
		}
		const info = await new CodemarkLinkCreator({
			request: this.request
		}).findCodemarkLink(
			this.attributes,
			this.trialRunMarkers,
			this.makeLink === 'public'
		);

		if (info) {
			this.existingCodemarkLink = info.codemarkLink;
			this.existingModel = this.model = info.codemark;
			this.existingPermalink = info.url;
			return true;
		}
	}
}

module.exports = CodemarkCreator;

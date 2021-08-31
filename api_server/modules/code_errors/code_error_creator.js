// this class should be used to create all code error documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const CodeError = require('./code_error');
const CodemarkHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_helper');
const PermalinkCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/permalink_creator');
const Indexes = require('./indexes');

class CodeErrorCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.codemarkHelper = new CodemarkHelper({ request: this });
	}

	get modelClass () {
		return CodeError;	// class to use to create a code error model
	}

	get collectionName () {
		return 'codeErrors';	// data collection to use
	}

	// convenience wrapper
	async createCodeError (attributes) {
		return await this.createModel(attributes);
	}

	// these attributes are required or optional to create a code error document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'streamId', 'postId', 'objectId', 'objectType']
			},
			optional: {
				string: ['providerUrl', 'entryPoint', 'title'],
				object: ['objectInfo'],
				boolean: ['_dontCreatePermalink'],
				'array(string)': ['followerIds'],
				'array(object)': ['stackTraces']
			}
		};
	}

	// get the query to determine if there is a matching code error already
	checkExistingQuery () {
		// we match on a New Relic object ID and object type, in which case we add a new stack trace as needed
		return {
			query: {
				teamId: this.attributes.teamId.toLowerCase(),
				objectId: this.attributes.objectId,
				objectType: this.attributes.objectType
			},
			hint: Indexes.byObjectId
		}
	}

	// determine if a matching model can exist
	modelCanExist () {
		// we match on a New Relic object ID and object type, in which case we add a new stack trace as needed
		return true;
	}

	// right before the document is saved...
	async preSave () {
		// special for-testing header for easy wiping of test data
		if (this.request.isForTesting()) {
			this.attributes._forTesting = true;
		}

		// establish some default attributes
		this.attributes.origin = this.origin || this.request.request.headers['x-cs-plugin-ide'] || '';
		this.attributes.originDetail = this.originDetail || this.request.request.headers['x-cs-plugin-ide-detail'] || '';
		this.attributes.creatorId = this.request.user.id;

		// this is just for testing
		this.dontCreatePermalink = this.attributes._dontCreatePermalink;
		delete this.attributes._dontCreatePermalink;

		// pre-allocate an ID
		this.createId();
		
		// get the team that will own this codemark
		await this.getTeam();

		// handle followers, either passed in or default for the given situation
		this.attributes.followerIds = await this.codemarkHelper.handleFollowers(
			this.attributes,
			{ team: this.team }
		);

		// create a permalink to this code error, as needed
		if (!this.dontCreatePermalink && !this.existingModel) {
			await this.createPermalink();
		}

		// if the object ID matched a known object, check if this is a new stack trace ...
		// if so, add it to the array of known stack traces
		const stackTracesToAdd = [];
		let didChange = false;
		if (this.existingModel) {
			(this.attributes.stackTraces || []).forEach(incomingStackTrace => {
				const index = (this.existingModel.get('stackTraces') || []).findIndex(existingStackTrace => {
					return existingStackTrace.text === incomingStackTrace.text;
				});
				if (index === -1) {
					stackTracesToAdd.push(incomingStackTrace);
					didChange = true;
				}
			});
			this.attributes.stackTraces = [
				...(this.existingModel.get('stackTraces') || []),
				...stackTracesToAdd
			];

			delete this.attributes.postId; // abort creating a new post
			delete this.attributes.creatorId; // don't change authors
		} else {
			// pre-set createdAt and lastActivityAt attributes
			this.attributes.createdAt = this.attributes.lastActivityAt = Date.now();
		}

		// proceed with the save...
		await super.preSave();

		// if we have an existing code error, and we added a stack trace, then the code error was truly modified,
		// otherwise, there are no changes to save
		if (this.existingModel && !didChange) {
			delete this.attributes.modifiedAt;
		}
	}

	// get the team that will own this code error
	async getTeam () {
		this.team = await this.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	
	}

	// create a permalink url to the codemark
	async createPermalink () {
		this.attributes.permalink = await new PermalinkCreator({
			request: this.request,
			codeError: this.attributes
		}).createPermalink();
	}
}

module.exports = CodeErrorCreator;

// this class should be used to create all code error documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const CodeError = require('./code_error');
const CodemarkHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_helper');
const PermalinkCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/permalink_creator');
const Indexes = require('./indexes');
const StreamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/stream_creator');
const StreamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/errors');

class CodeErrorCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.codemarkHelper = new CodemarkHelper({ request: this.request });
		this.errorHandler.add(StreamErrors);
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
		const attributes = {
			required: {
				number: ['accountId'],
				string: ['postId', 'objectId', 'objectType']
			},
			optional: {
				string: ['providerUrl', 'entryPoint', 'title', 'text'],
				object: ['objectInfo'],
				boolean: ['_dontCreatePermalink', '_forNRMigration', '_fromNREngine'],
				'array(object)': ['stackTraces']
			}
		};

		if (!this.forCommentEngine) {
			attributes.required.string.push('teamId');
		} else {
			attributes.optional.string.push('teamId');
		}
		return attributes;
	}

	// get the query to determine if there is a matching code error already
	checkExistingQuery () {
		// we match on a New Relic object ID and object type, in which case we add a new stack trace as needed
		return {
			query: {
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

		// create a teamless stream for this code error
		if (!this.existingModel) {
			await this.createStream();
		} else if (
			this.attributes.teamId &&
			this.existingModel.get('teamId') &&
			this.attributes.teamId !== this.existingModel.get('teamId')
		) {
		 	throw this.errorHandler.error('createAuth', { reason: 'code error exists and is owned by another team' });
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
		
		// handle followers, either passed in or default for the given situation
		this.attributes.followerIds = await this.codemarkHelper.handleFollowers(this.attributes, { ignorePreferences: true });

		// create a permalink to this code error, as needed
		if (!this.dontCreatePermalink && !this.existingModel) {
			await this.createPermalink();
		}
		// handle concerns with existing code errors as needed
		let didChange = false;
		if (this.existingModel) {
			didChange = await this.handleExistingCodeError();
			this.stream = await this.data.streams.getById(this.existingModel.get('streamId'));
			if (!this.stream) {
				throw this.errorHandler.error('notFound', { info: 'code error stream' });
			}
		} else {
			// pre-set createdAt and lastActivityAt attributes
			this.attributes.createdAt = this.attributes.lastActivityAt = this.setCreatedAt || Date.now();
		}

		// proceed with the save...
		await super.preSave({ setModifiedAt: this.setModifiedAt || this.setCreatedAt });

		// if we have an existing code error, and we added a stack trace, then the code error was truly modified,
		// otherwise, there are no changes to save
		if (this.existingModel && !didChange) {
			delete this.attributes.modifiedAt;
		}
	}

	// create a stream for this code error
	async createStream () {
		this.transforms.createdStreamForCodeError = this.stream = await new StreamCreator({
			request: this.request,
			nextSeqNum: this.replyIsComing ? 3 : 2
		}).createStream({
			type: 'object',
			privacy: 'public',
			accountId: this.attributes.accountId,
			objectId: this.attributes.objectId,
			objectType: this.attributes.objectType,
			teamId: this.attributes.teamId
			//memberIds: [this.user.id]
		});
		this.attributes.streamId = this.stream.id;
	}

	// handle concerns with existing code errors
	async handleExistingCodeError () {
		const stackTracesToAdd = [];
		let didChange = false;

		// account ID must match
		if (this.attributes.accountId !== this.existingModel.get('accountId')) {
			throw this.errorHandler.error('createAuth', { reason: 'found existing object but account ID does not match' });
		}

		// must be a member of the team that owns the code error, if any
		if (
			!this.forCommentEngine &&	// TODO: decide whether users automatically become members of the team
			this.existingModel.get('teamId') &&
			!this.user.hasTeam(this.existingModel.get('teamId'))
		) {
			throw this.errorHandler.error('readAuth', { reason: 'user is not on the team that owns this code error' });
		}
	
		/*
		// creator of the code error must be a fellow teammate
		if (!(this.allowFromUserId && this.allowFromUserId === this.user.id)) {
			await this.ensureAuthorized();
		}
		*/

		// check if this is a new stack trace ...
		// if so, add it to the array of known stack traces
		(this.attributes.stackTraces || []).forEach(incomingStackTrace => {
			const index = (this.existingModel.get('stackTraces') || []).findIndex(existingStackTrace => {
				if (existingStackTrace.traceId && incomingStackTrace.traceId) {
					return existingStackTrace.traceId === incomingStackTrace.traceId;
				} else {
					return existingStackTrace.text === incomingStackTrace.text;
				}
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

		return didChange;
	}

	// create a permalink url to the codemark
	async createPermalink () {
		if (this.attributes.teamId) {
			this.attributes.permalink = await new PermalinkCreator({
				request: this.request,
				codeError: this.attributes
			}).createPermalink();
		}
	}
}

module.exports = CodeErrorCreator;

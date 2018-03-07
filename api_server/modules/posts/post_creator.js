// this class should be used to create all post documents in the database

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Post = require('./post');
const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const StreamCreator = require(process.env.CS_API_TOP + '/modules/streams/stream_creator');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');
const LastReadsUpdater = require('./last_reads_updater');
const PostAttributes = require('./post_attributes');
const PostPublisher = require('./post_publisher');
const EmailNotificationQueue = require('./email_notification_queue');
const IntegrationHandler = require('./integration_handler');

class PostCreator extends ModelCreator {

	get modelClass () {
		return Post;	// class to use to create a post model
	}

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	createPost (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	// normalize post creation operation (pre-save)
	normalize (callback) {
		// if we have code blocks, make sure they are valid
		if (this.attributes.codeBlocks) {
			this.validateCodeBlocks(callback);
		}
		else {
			callback();
		}
	}

	// get attributes that are required for post creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			optional: {
				string: ['streamId', 'text', 'commitHashWhenPosted', 'parentPostId', 'origin'],
				object: ['stream'],
				'array(object)': ['codeBlocks'],
				'array(string)': ['mentionedUserIds']
			}
		};
	}

	// validate attributes for the post we are creating
	validateAttributes (callback) {
		if (!this.attributes.streamId && typeof this.attributes.stream !== 'object') {
			// must have a stream ID or a stream object (for creating streams on the fly)
			return callback(this.errorHandler.error('parameterRequired', { info: 'streamId or stream' }));
		}
		if (this.attributes.codeBlocks && !this.attributes.commitHashWhenPosted) {
			// if we have code blocks, must have a commit hash
			return callback(this.errorHandler.error('parameterRequired', { info: 'commitHashWhenPosted' }));
		}
		callback();
	}

	// validate the code blocks sent with the post creation
	validateCodeBlocks (callback) {
		// must be an array of objects
		let result = new Post().validator.validateArrayOfObjects(
			this.attributes.codeBlocks,
			PostAttributes.codeBlocks
		);
		if (result) {	// really an error
			return callback(this.errorHandler.error('validation', { info: `codeBlocks: ${result}` }));
		}
		// validate each code block in turn
		BoundAsync.forEachSeries(
			this,
			this.attributes.codeBlocks,
			this.validateCodeBlock,
			error => {
				if (error) {
					return callback(this.errorHandler.error('validation', { info: `codeBlocks: ${error}` }));
				}
				else {
					callback();
				}
			}
		);
	}

	// validate a single code block
	validateCodeBlock (codeBlock, callback) {
		let numKeys = 1;	// we are strict about which keys can be in the code block object
		// must have code with the code block
		if (typeof codeBlock.code !== 'string') {
			return callback('code must be a string');
		}
		// can have pre- and post- context, must be a string
		if (typeof codeBlock.preContext !== 'undefined') {
			numKeys++;
			if (typeof codeBlock.preContext !== 'string') {
				return callback('preContext must be a string');
			}
		}
		if (typeof codeBlock.postContext !== 'undefined') {
			numKeys++;
			if (typeof codeBlock.postContext !== 'string') {
				return callback('postContext must be a string');
			}
		}
		if (typeof codeBlock.location !== 'undefined') {
			numKeys++;
			// the location coordinates must be valid
			let result = MarkerCreator.validateLocation(codeBlock.location);
			if (result) {
				return callback(result);
			}
		}
		// if the code block specifies a stream ID (which can be different from the
		// stream ID for the post), it must be a valid ID
		if (codeBlock.streamId) {
			numKeys++;
			let result = new Post().validator.validateId(codeBlock.streamId);
			if (result) {
				return callback('streamId is not a valid ID');
			}
		}
		if (Object.keys(codeBlock).length > numKeys) {
			// there can't be any additional attributes in the code block
			return callback('improper attributes');
		}
		process.nextTick(callback);
	}

	// called before the post is actually saved
	preSave (callback) {
		if (this.attributes.commitHashWhenPosted) {
			// commit hash always converted to lowercase
			this.attributes.commitHashWhenPosted = this.attributes.commitHashWhenPosted.toLowerCase();
		}
		this.attributes.creatorId = this.user.id;
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		BoundAsync.series(this, [
			this.getStream,			// get the stream for the post
			this.getRepo,			// get the repo (for posts in file-type streams)
			this.getTeam,			// get the team that owns the stream
			this.getCompany,		// get the company that owns the team
			this.createStream,		// create the stream, if requested to create on-the-fly
			this.createId,			// create an ID for the post
			this.createMarkers,		// create markers for any code blocks sent
			this.getSeqNum,			// requisition a sequence number for the post
			super.preSave,			// base-class preSave
			this.updateStream,		// update the stream as needed
			this.updateLastReads,	// update lastReads attributes for affected users
			this.updateMarkersForReply,	// update markers, if this is a reply to a parent with a code block
			this.updatePostCount	// update the post count for the author of the post
		], callback);
	}

	// get the stream we're trying to create the post in
	getStream (callback) {
		if (!this.attributes.streamId) {
			return callback();	// stream will be created on-the-fly
		}
		this.data.streams.getById(
			this.attributes.streamId,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.errorHandler.error('notFound', { info: 'stream'}));
				}
				this.stream = stream;
				callback();
			}
		);
	}

	// get the repo to which the stream belongs, if it is a file-type stream
	getRepo (callback) {
		let repoId = this.stream ?
			this.stream.get('repoId') :		// stream given by ID
			this.attributes.stream.repoId;	// on-the-fly stream
		if (!repoId) {
			return callback();	// not a file-type stream
		}
		this.data.repos.getById(
			repoId,
			(error, repo) => {
				if (error) { return callback(error); }
				if (!repo) {
					return callback(this.errorHandler.error('notFound', { info: 'repo'}));
				}
				this.repo = repo;
				this.attributes.repoId = repo.id;	// post gets the same repoId as the stream
				callback();
			}
		);
	}

	// get the team that owns the stream for which the post is being created
	getTeam (callback) {
		let teamId;
		if (this.repo) {
			teamId = this.repo.get('teamId');
		}
		else if (this.stream) {
			teamId = this.stream.get('teamId');
		}
		else if (this.attributes.stream) {
			teamId = this.attributes.stream.teamId;
		}
		if (!teamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		this.data.teams.getById(
			teamId,
			(error, team) => {
				if (error) { return callback(error); }
				if (!team) {
					return callback(this.errorHandler.error('notFound', { info: 'team'}));
				}
				this.team = team;
				this.attributes.teamId = team.id;
				callback();
			}
		);
	}

	// get the company that owns the team for which the post is being created
	// only needed for analytics so we only do this for inbound emails or
	getCompany (callback) {
		if (!this.forInboundEmail && !this.forIntegration) {
			return callback();
		}
		this.data.companies.getById(
			this.team.get('companyId'),
			(error, company) => {
				if (error) { return callback(error); }
				this.company = company;
				callback();
			}
		);
	}

	// for streams created on-the-fly, create the stream now
	createStream (callback) {
		if (this.stream) {
			return callback(); // not an on-the-fly stream creation
		}
		this.attributes.stream.teamId = this.team.id;
		new StreamCreator({
			request: this.request,
			nextSeqNum: 2
		}).createStream(
			this.attributes.stream,
			(error, stream) => {
				if (error) { return callback(error); }
				this.stream = stream;
				this.attributes.streamId = stream.id;
				this.attachToResponse.stream = this.stream.getSanitizedObject(); // put the stream object in the request response
				delete this.attributes.stream;
				this.createdStream = true;
				process.nextTick(callback);
			}
		);
	}

	// requisition an ID for the post
	createId (callback) {
		this.attributes._id = this.data.posts.createId();
		callback();
	}

	// create markers associated with code blocks for the post
	createMarkers (callback) {
		if (!this.attributes.codeBlocks) {
			return callback();	// no code blocks
		}
		this.markers = [];	// unsanitized
		this.attachToResponse.markers = [];	// sanitized, to be sent in the response
		this.attachToResponse.markerLocations = {	// marker locations, to be sent in the response
			teamId: this.attributes.teamId,
			streamId: this.attributes.streamId,
			commitHash: this.attributes.commitHashWhenPosted,
			locations: {}
		};
		BoundAsync.forEachLimit(
			this,
			this.attributes.codeBlocks,
			10,
			this.createMarker,
			callback
		);
	}

	// create a marker, associated with a given code block
	createMarker (codeBlock, callback) {
		let markerInfo = {
			teamId: this.attributes.teamId,
			streamId: codeBlock.streamId || this.attributes.streamId,
			postId: this.attributes._id,
			commitHash: this.attributes.commitHashWhenPosted
		};
		if (codeBlock.location) { // not strictly required
			markerInfo.location = codeBlock.location;
		}
		new MarkerCreator({
			request: this.request
		}).createMarker(
			markerInfo,
			(error, marker) => {
				if (error) { return callback(error); }
				this.markers.push(marker);
				codeBlock.markerId = marker.id;
				delete codeBlock.streamId; // gets put into the marker
				let markerObject = marker.getSanitizedObject();
				this.attachToResponse.markers.push(markerObject);
				if (codeBlock.location) {
					this.attachToResponse.markerLocations.locations[marker.id] = codeBlock.location;
					delete codeBlock.location; // gets put into the marker locations object
				}
				process.nextTick(callback);
			}
		);
	}

	// requisition a sequence number for this post
	getSeqNum (callback) {
		if (this.createdStream) {
			// if we created the stream, start out with seqNum of 1
			this.attributes.seqNum = 1;
			return callback();
		}
		let seqNum = null;
		let numRetries = 0;
		let gotError = null;
		// this is a mutex-type operation ... we never want to assign the same
		// sequence number to two posts ... we maintain the next sequence number
		// in the stream document, and use findAndModify to increment the next
		// sequence number and fetch the current sequence number in the same
		// atomic operation, ensuring no one will ever get the same value ...
		// since we can get race conditions here (very rare), we'll put this in
		// a retry loop
		BoundAsync.whilst(
			this,
			() => {
				return !seqNum && numRetries < 20;
			},
			(whilstCallback) => {
				this.data.streams.findAndModify(
					{ _id: this.data.streams.objectIdSafe(this.attributes.streamId) },
					{ $inc: { nextSeqNum: 1 } },
					(error, foundStream) => {
						if (error) {
							numRetries++;
							gotError = error;
						}
						else {
							gotError = null;
							seqNum = foundStream.nextSeqNum;
						}
					 	process.nextTick(whilstCallback);
					},
					{
						databaseOptions: {
							fields: { nextSeqNum: 1 }
						}
					}
				);
			},
			() => {
				if (!gotError) {
					this.attributes.seqNum = seqNum;
				}
				callback(gotError);
			}
		);
	}

	// update the stream associated with the created post
	updateStream (callback) {
		// update the mostRecentPostId attribute, and the sortId attribute
		// (which is the same if there is a post in the stream) to the ID of
		// the created post
		let op = {
			$set: {
				mostRecentPostId: this.attributes._id,
				sortId: this.attributes._id
			}
		};
		// increment the number of markers in this stream
		if (this.markers && this.markers.length) {
			op.$inc = { numMarkers: this.markers.length };
		}
		this.data.streams.applyOpById(
			this.model.get('streamId'),
			op,
			callback
		);
	}

	// update the lastReads attribute for each user in the stream or team,
	// for those users for whom this post represents a new unread message
	updateLastReads (callback) {
		new LastReadsUpdater({
			data: this.data,
			user: this.user,
			stream: this.stream,
			team: this.team,
			previousPostSeqNum: this.attributes.seqNum - 1,
			logger: this
		}).updateLastReads(callback);
	}

	// if the created post is a reply to a parent with code blocks, then the
	// markers for those code blocks get their numComments attribute incremented
	updateMarkersForReply (callback) {
		// this only applies to replies
		if (!this.model.get('parentPostId')) {
			return callback();
		}
		BoundAsync.series(this, [
			this.getParentPost,
			this.updateMarkersForParentPost
		], callback);
	}

	// get the parent post, for replies
	getParentPost (callback) {
		this.data.posts.getById(
			this.model.get('parentPostId'),
			(error, parentPost) => {
				if (error) { return callback(error); }
				if (!parentPost) {
					return callback();	// this really shouldn't happen, but it's not worth an error
				}
				// collect all marker IDs for code blocks referred to by the parent post
				this.parentPost = parentPost;
				let codeBlocks = parentPost.get('codeBlocks') || [];
				this.parentPostMarkerIds = codeBlocks.map(codeBlock => codeBlock.markerId);
				callback();
			}
		);
	}

	// update all markers for code blocks referred to by a parent post, increment numComments attribute
	updateMarkersForParentPost (callback) {
		if (!this.parentPostMarkerIds || !this.parentPostMarkerIds.length) {
			return callback();
		}
		this.attachToResponse.markers = this.attachToResponse.markers || [];
		BoundAsync.forEachLimit(
			this,
			this.parentPostMarkerIds,
			5,
			this.updateMarkerForParentPost,
			callback
		);
	}

	// for a single marker for a code block referred to by a parent post,
	// increment its numComments attribute
	updateMarkerForParentPost (markerId, callback) {
		let op = { $inc: { numComments: 1 } };
		this.data.markers.applyOpById(
			markerId,
			op,
			error => {
				if (error) { return callback(error); }
				let messageOp = Object.assign({}, op, { _id: markerId });
				this.attachToResponse.markers.push(messageOp);	// we'll send the increment in the response (and also the pubnub message)
				callback();
			}
		);
	}

	// update the total post count for the author of the post, along with the date/time of last post
	updatePostCount (callback) {
		this.updatePostCountOp = {
			$inc: { totalPosts: 1 },
			$set: { lastPostCreatedAt: Date.now() }
		};
		this.data.users.applyOpById(
			this.user.id,
			this.updatePostCountOp,
			callback
		);
	}

	// after the post was created...
	postCreate (callback) {
		BoundAsync.parallel(this, [
			this.publishPost,
			this.triggerNotificationEmails,
			this.doIntegrationHooks,
			this.publishPostCount,
			this.sendPostCountToAnalytics,
			this.trackPost
		], callback);
	}

	// publish the post to the appropriate messager channel
	publishPost (callback) {
		new PostPublisher({
			request: this.request,
			data: this.request.responseData,
			messager: this.api.services.messager,
			stream: this.stream.attributes
		}).publishPost(callback);
	}

	// send an email notification as needed to users who are offline
	triggerNotificationEmails (callback) {
		if (this.requestSaysToBlockEmails()) {
			// don't do email notifications for unit tests, unless asked
			this.request.log('Would have triggered email notifications for stream ' + this.stream.id);
			return callback();
		}
		const queue = new EmailNotificationQueue({
			request: this.request,
			post: this.model,
			stream: this.stream
		});
		queue.initiateEmailNotifications(error => {
			if (error) {
				this.request.warn(`Unable to queue email notifications for stream ${this.stream.id} and post ${this.model.id}: ${error.toString()}`);
			}
			callback();
		});
	}

	// handle any integration hooks triggered by a new post
	doIntegrationHooks (callback) {
		new IntegrationHandler({
			request: this.request
		}).handleNewPost({
			post: this.model,
			team: this.team,
			repo: this.repo,
			stream: this.stream,
			creator: this.user,
			parentPost: this.parentPost,
			parentPostCreator: this.parentPostAuthor
		}, callback);
	}

	// publish an increase in post count to the author's me-channel
	publishPostCount (callback) {
		if (!this.updatePostCountOp) {
			return callback();	// no joinMethod update to perform
		}
		let channel = 'user-' + this.user.id;
		let message = {
			requestId: this.request.request.id,
			user: Object.assign({}, this.updatePostCountOp, { _id: this.user.id })
		};
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Could not publish post count update message to user ${this.user._id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this.request
			}
		);
	}

	// send the post count update to our analytics service
	sendPostCountToAnalytics (callback) {
		// check if user has opted out
		const preferences = this.user.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return callback();
		}

		this.api.services.analytics.setPerson(
			this.user.id,
			{
				'Total Posts': this.user.get('totalPosts'),
				'Date of Last Post': new Date(this.user.get('lastPostCreatedAt')).toISOString()
			},
			{
				request: this.request,
				user: this.user
			}
		);
		process.nextTick(callback);
	}

	// track this post for analytics, with the possibility that the user may have opted out
	trackPost (callback) {
		// only track for inbound emails or integrations, client-originating posts are
		// tracked by the client
		if (!this.forInboundEmail && !this.forIntegration) {
			return callback();
		}
		const endpoint = this.forInboundEmail ? 'Email' : this.forIntegration;

		// check if user has opted out
		const preferences = this.user.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return callback();
		}

		const trackObject = {
			distinct_id: this.user.id,
			Type: 'Chat',
			Thread: 'Parent',
			Category: 'Source File',
			'Email Address': this.user.get('email'),
			'Join Method': this.user.get('joinMethod'),
			'Team ID': this.team ? this.team.id : undefined,
 			'Team Size': this.team ? this.team.get('memberIds').length : undefined,
			Company: this.company.get('name'),
			'Endpoint': endpoint,
			'Plan': 'Free', // FIXME: update when we have payments
			'Date of Last Post': new Date(this.model.get('createdAt')).toISOString()
		};
		if (this.user.get('registeredAt')) {
			trackObject['Date Signed Up'] = new Date(this.user.get('registeredAt')).toISOString();
		}
		if (this.user.get('totalPosts') === 1) {
			trackObject['First Post?'] = new Date(this.model.get('createdAt')).toISOString();
		}
		this.api.services.analytics.track(
			'Post Created',
			trackObject,
			{
				request: this.request,
				user: this.user
			}
		);
		process.nextTick(callback);
	}

	// determine if special header was sent with the request that says to block emails
	requestSaysToBlockEmails () {
		return (
			this.request.request.headers &&
			this.request.request.headers['x-cs-block-email-sends']
		);
	}

}

module.exports = PostCreator;

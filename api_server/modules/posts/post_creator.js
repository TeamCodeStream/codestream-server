// this class should be used to create all post documents in the database

'use strict';

const Post = require('./post');
const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const StreamCreator = require(process.env.CS_API_TOP + '/modules/streams/stream_creator');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');
const LastReadsUpdater = require('./last_reads_updater');
const PostAttributes = require('./post_attributes');
const PostPublisher = require('./post_publisher');
const EmailNotificationQueue = require('./email_notification_queue');
const IntegrationHandler = require('./integration_handler');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class PostCreator extends ModelCreator {

	get modelClass () {
		return Post;	// class to use to create a post model
	}

	get collectionName () {
		return 'posts';	// data collection to use
	}

	// convenience wrapper
	async createPost (attributes) {
		return await this.createModel(attributes);
	}

	// normalize post creation operation (pre-save)
	async normalize () {
		// if we have code blocks, make sure they are valid
		if (this.attributes.codeBlocks) {
			await this.validateCodeBlocks();
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
	async validateAttributes () {
		if (!this.attributes.streamId && typeof this.attributes.stream !== 'object') {
			// must have a stream ID or a stream object (for creating streams on the fly)
			return this.errorHandler.error('parameterRequired', { info: 'streamId or stream' });
		}
		if (this.attributes.codeBlocks && !this.attributes.commitHashWhenPosted) {
			// if we have code blocks, must have a commit hash
			return this.errorHandler.error('parameterRequired', { info: 'commitHashWhenPosted' });
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
		// validate each code block in turn
		try {
			for (let codeBlock of this.attributes.codeBlocks) {
				await this.validateCodeBlock(codeBlock);
			}
		}
		catch (error) {
			throw this.errorHandler.error('validation', { info: `codeBlocks: ${error}` });
		}
	}

	// validate a single code block
	async validateCodeBlock (codeBlock) {
		let numKeys = 1;	// we are strict about which keys can be in the code block object
		// must have code with the code block
		if (typeof codeBlock.code !== 'string') {
			throw 'code must be a string';
		}
		// can have pre- and post- context, must be a string
		if (typeof codeBlock.preContext !== 'undefined') {
			numKeys++;
			if (typeof codeBlock.preContext !== 'string') {
				throw 'preContext must be a string';
			}
		}
		if (typeof codeBlock.postContext !== 'undefined') {
			numKeys++;
			if (typeof codeBlock.postContext !== 'string') {
				throw 'postContext must be a string';
			}
		}
		if (typeof codeBlock.location !== 'undefined') {
			numKeys++;
			// the location coordinates must be valid
			const result = MarkerCreator.validateLocation(codeBlock.location);
			if (result) {
				throw result;
			}
		}
		// if the code block specifies a stream ID (which can be different from the
		// stream ID for the post), it must be a valid ID
		if (codeBlock.streamId) {
			numKeys++;
			const result = new Post().validator.validateId(codeBlock.streamId);
			if (result) {
				throw 'streamId is not a valid ID';
			}
		}
		// if the code block specifies a file, then we are being asked to create
		// (or find) a stream for that file, and use that for the code block
		if (codeBlock.file) {
			if (!codeBlock.streamId && !codeBlock.repoId) {
				throw 'repoId required for codeBlock with file';
			}
			const result = new Post().validator.validateId(codeBlock.repoId);
			if (result) {
				throw `code block repoId is not valid: ${result}`;
			}
			numKeys += 2;
		}

		if (Object.keys(codeBlock).length > numKeys) {
			// there can't be any additional attributes in the code block
			throw 'improper attributes';
		}
	}

	// called before the post is actually saved
	async preSave () {
		if (this.attributes.commitHashWhenPosted) {
			// commit hash always converted to lowercase
			this.attributes.commitHashWhenPosted = this.attributes.commitHashWhenPosted.toLowerCase();
		}
		this.attributes.creatorId = this.user.id;
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		await this.getStream();			// get the stream for the post
		await this.getCodeBlockStreams();	// get streams for any code blocks outside of this stream
		await this.getRepo();			// get the repo (for posts in file-type streams)
		await this.getTeam();			// get the team that owns the stream
		await this.getCompany();		// get the company that owns the team
		await this.createStream();		// create the stream, if requested to create on-the-fly
		await this.createCodeBlockStreams();	// create streams for any code blocks outside of this stream
		this.createId();				// create an ID for the post
		await this.createMarkers();		// create markers for any code blocks sent
		await this.getSeqNum();			// requisition a sequence number for the post
		await super.preSave();			// base-class preSave
		await this.updateStream();		// update the stream as needed
		await this.updateLastReads();	// update lastReads attributes for affected users
		await this.updateMarkersForReply();	// update markers, if this is a reply to a parent with a code block
		await this.updatePostCount();	// update the post count for the author of the post
	}

	// get the stream we're trying to create the post in
	async getStream () {
		if (!this.attributes.streamId) {
			return;	// stream will be created on-the-fly
		}
		this.stream = await this.data.streams.getById(this.attributes.streamId);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream'});
		}
	}

	// get streams for any code blocks outside of this stream
	async getCodeBlockStreams () {
		if (!this.attributes.codeBlocks) {
			return;
		}
		// extract the stream IDs for all code blocks that aren't from the same
		// stream as the post itself
		const streamIds = this.attributes.codeBlocks.reduce((current, codeBlock) => {
			if (codeBlock.streamId && codeBlock.streamId !== this.attributes.streamId) {
				current.push(codeBlock.streamId);
			}
			return current;
		}, []);
		if (streamIds.length === 0) {
			return;
		}
		this.codeBlockStreams = await this.data.streams.getByIds(streamIds);
	}

	// get the repo to which the stream belongs, if it is a file-type stream
	async getRepo () {
		const repoId = this.stream ?
			this.stream.get('repoId') :		// stream given by ID
			this.attributes.stream.repoId;	// on-the-fly stream
		if (!repoId) {
			return;	// not a file-type stream
		}
		this.repo = await this.data.repos.getById(repoId);
		if (!this.repo) {
			throw this.errorHandler.error('notFound', { info: 'repo'});
		}
		this.attributes.repoId = this.repo.id;	// post gets the same repoId as the stream
	}

	// get the team that owns the stream for which the post is being created
	async getTeam () {
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
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	// post gets the same teamId as the stream
	}

	// get the company that owns the team for which the post is being created
	// only needed for analytics so we only do this for inbound emails or
	async getCompany () {
		if (!this.forInboundEmail && !this.forIntegration) {
			// only needed for inbound email or integration posts, for tracking
			return;
		}
		this.company = await this.data.companies.getById(this.team.get('companyId'));
	}

	// for streams created on-the-fly, create the stream now
	async createStream () {
		if (this.stream) {
			return; // not an on-the-fly stream creation
		}
		this.attributes.stream.teamId = this.team.id;
		this.stream = await new StreamCreator({
			request: this.request,
			nextSeqNum: 2
		}).createStream(this.attributes.stream);
		this.attributes.streamId = this.stream.id;
		// put the stream object in the request response
		this.attachToResponse.streams = this.attachToResponse.streams || [];
		this.attachToResponse.streams.push(this.stream.getSanitizedObject());
		delete this.attributes.stream;
		this.createdStream = true;
	}

	// create streams for any code blocks outside of this stream
	async createCodeBlockStreams () {
		if (!this.attributes.codeBlocks) {
			return;
		}
		this.codeBlockStreams = this.codeBlockStreams || [];
		await Promise.all(this.attributes.codeBlocks.map(async codeBlock => {
			await this.createCodeBlockStream(codeBlock);
		}));
	}

	// create a stream for any code block that specifies stream characteristics
	async createCodeBlockStream (codeBlock) {
		if (codeBlock.streamId || !codeBlock.file) {
			return;
		}
		const streamInfo = {
			teamId: this.team.id,
			repoId: codeBlock.repoId,
			type: 'file',
			file: codeBlock.file
		};
		const createdStream = await new StreamCreator({
			request: this.request,
			nextSeqNum: 2
		}).createStream(streamInfo);
		codeBlock.streamId = createdStream.id;
		this.attachToResponse.streams = this.attachToResponse.streams || [];
		this.attachToResponse.streams.push(createdStream.getSanitizedObject());
		this.codeBlockStreams.push(createdStream);
	}

	// requisition an ID for the post
	createId () {
		this.attributes._id = this.data.posts.createId();
	}

	// create markers associated with code blocks for the post
	async createMarkers () {
		if (!this.attributes.codeBlocks) {
			return;	// no code blocks
		}
		this.markers = [];	// unsanitized
		this.attachToResponse.markers = [];	// sanitized, to be sent in the response
		this.attachToResponse.markerLocations = [];
		for (let codeBlock of this.attributes.codeBlocks) {
			await this.createMarker(codeBlock);
		}
	}

	// create a marker, associated with a given code block
	async createMarker (codeBlock) {
		const streamId = codeBlock.streamId || this.attributes.streamId;
		let markerInfo = {
			teamId: this.attributes.teamId,
			streamId: streamId,
			postId: this.attributes._id,
			commitHash: this.attributes.commitHashWhenPosted
		};
		if (codeBlock.location) { // not strictly required
			markerInfo.location = codeBlock.location;
		}

		const marker = await new MarkerCreator({
			request: this.request
		}).createMarker(markerInfo);

		this.markers.push(marker);
		codeBlock.markerId = marker.id;
		await this.assignFileAndRepoInfo(codeBlock, markerInfo);
		delete codeBlock.streamId; // gets put into the marker
		const markerObject = marker.getSanitizedObject();
		this.attachToResponse.markers.push(markerObject);
		if (codeBlock.location) {
			this.addLocation(streamId, marker.id, codeBlock.location);
			delete codeBlock.location;
		}
	}

	// assign a file and repo to a code block, we store these with the code block itself,
	// for informational purposes
	async assignFileAndRepoInfo (codeBlock, markerInfo) {
		// the code block gets the file path of the source file, and the url of the repo
		const codeBlockStream = markerInfo.streamId === this.attributes.streamId ? this.stream :
			(this.codeBlockStreams || []).find(stream => stream.id === markerInfo.streamId);
		if (!codeBlockStream) { return; }
		codeBlock.file = codeBlockStream.get('file');
		codeBlock.repoId = codeBlockStream.get('repoId');
		let repo;
		if (this.repo && codeBlock.repoId === this.repo.id) {
			repo = this.repo;
		}
		else {
			repo = await this.data.repos.getById(codeBlock.repoId);
		}
		if (repo) {
			codeBlock.repo = repo.get('normalizedUrl');
		}
	}

	// add a marker location to the appropriate marker locations structure, to be returned
	// to the client
	addLocation (streamId, markerId, location) {
		let markerLocations = this.attachToResponse.markerLocations.find(ml => {
			return ml.streamId === streamId;
		});
		if (!markerLocations) {
			this.attachToResponse.markerLocations.push({
				teamId: this.attributes.teamId,
				streamId,
				commitHash: this.attributes.commitHashWhenPosted,
				locations: {}
			});
			markerLocations = this.attachToResponse.markerLocations[this.attachToResponse.markerLocations.length - 1];
		}
		markerLocations.locations[markerId] = location;
	}

	// requisition a sequence number for this post
	async getSeqNum () {
		if (this.createdStream) {
			// if we created the stream, start out with seqNum of 1
			this.attributes.seqNum = 1;
			return;
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
		while (!seqNum && numRetries < 20) {
			let foundStream;
			try {
				foundStream = await this.data.streams.findAndModify(
					{ _id: this.data.streams.objectIdSafe(this.attributes.streamId) },
					{ $inc: { nextSeqNum: 1 } },
					{
						databaseOptions: {
							fields: { nextSeqNum: 1 }
						}
					}
				);
			}
			catch (error) {
				numRetries++;
				gotError = error;
				continue;
			}
			gotError = null;
			seqNum = foundStream.nextSeqNum;
		}
		if (gotError) {
			throw gotError;
		}
		this.attributes.seqNum = seqNum;
	}

	// update the stream associated with the created post
	async updateStream () {
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
		await this.data.streams.applyOpById(
			this.model.get('streamId'),
			op
		);
	}

	// update the lastReads attribute for each user in the stream or team,
	// for those users for whom this post represents a new unread message
	async updateLastReads () {
		await new LastReadsUpdater({
			data: this.data,
			user: this.user,
			stream: this.stream,
			team: this.team,
			previousPostSeqNum: this.attributes.seqNum - 1,
			logger: this
		}).updateLastReads();
	}

	// if the created post is a reply to a parent with code blocks, then the
	// markers for those code blocks get their numComments attribute incremented
	async updateMarkersForReply () {
		// this only applies to replies
		if (!this.model.get('parentPostId')) {
			return;
		}
		await this.getParentPost();
		await this.updateMarkersForParentPost();
	}

	// get the parent post, for replies
	async getParentPost () {
		this.parentPost = await this.data.posts.getById(this.model.get('parentPostId'));
		if (!this.parentPost) { return; }	// this really shouldn't happen, but it's not worth an error
		// collect all marker IDs for code blocks referred to by the parent post
		const codeBlocks = this.parentPost.get('codeBlocks') || [];
		this.parentPostMarkerIds = codeBlocks.map(codeBlock => codeBlock.markerId);
	}

	// update all markers for code blocks referred to by a parent post, increment numComments attribute
	async updateMarkersForParentPost () {
		if (!this.parentPostMarkerIds || !this.parentPostMarkerIds.length) {
			return;
		}
		this.attachToResponse.markers = this.attachToResponse.markers || [];
		for (let markerId of this.parentPostMarkerIds) {
			await this.updateMarkerForParentPost(markerId);
		}
	}

	// for a single marker for a code block referred to by a parent post,
	// increment its numComments attribute
	async updateMarkerForParentPost (markerId) {
		const op = { $inc: { numComments: 1 } };
		await this.data.markers.applyOpById(markerId, op);
		const messageOp = Object.assign({}, op, { _id: markerId });
		this.attachToResponse.markers.push(messageOp);	// we'll send the increment in the response (and also the pubnub message)
	}

	// update the total post count for the author of the post, along with the date/time of last post
	async updatePostCount () {
		this.updatePostCountOp = {
			$inc: { totalPosts: 1 },
			$set: { lastPostCreatedAt: Date.now() }
		};
		await this.data.users.applyOpById(
			this.user.id,
			this.updatePostCountOp
		);
	}

	// after the post was created...
	async postCreate () {
		await awaitParallel([
			this.publishPost,
			this.triggerNotificationEmails,
			this.doIntegrationHooks,
			this.publishPostCount,
			this.sendPostCountToAnalytics,
			this.trackPost,
			this.updateMentions
		], this);
	}

	// publish the post to the appropriate messager channel
	async publishPost () {
		await new PostPublisher({
			request: this.request,
			data: this.request.responseData,
			messager: this.api.services.messager,
			stream: this.stream.attributes
		}).publishPost();
	}

	// send an email notification as needed to users who are offline
	async triggerNotificationEmails () {
		if (this.requestSaysToBlockEmails()) {
			// don't do email notifications for unit tests, unless asked
			this.request.log('Would have triggered email notifications for stream ' + this.stream.id);
			return;
		}
		const queue = new EmailNotificationQueue({
			request: this.request,
			post: this.model,
			stream: this.stream
		});
		try {
			await queue.initiateEmailNotifications();
		}
		catch (error) {
			this.request.warn(`Unable to queue email notifications for stream ${this.stream.id} and post ${this.model.id}: ${error.toString()}`);
		}
	}

	// handle any integration hooks triggered by a new post
	async doIntegrationHooks () {
		await new IntegrationHandler({
			request: this.request
		}).handleNewPost({
			post: this.model,
			team: this.team,
			repo: this.repo,
			stream: this.stream,
			creator: this.user,
			parentPost: this.parentPost,
			parentPostCreator: this.parentPostAuthor
		});
	}

	// publish an increase in post count to the author's me-channel
	async publishPostCount () {
		if (!this.updatePostCountOp) {
			return;	// no joinMethod update to perform
		}
		const channel = 'user-' + this.user.id;
		const message = {
			requestId: this.request.request.id,
			user: Object.assign({}, this.updatePostCountOp, { _id: this.user.id })
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish post count update message to user ${this.user._id}: ${JSON.stringify(error)}`);
		}
	}

	// send the post count update to our analytics service
	async sendPostCountToAnalytics () {
		// check if user has opted out
		const preferences = this.user.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return;
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
	}

	// track this post for analytics, with the possibility that the user may have opted out
	async trackPost () {
		// only track for inbound emails or integrations, client-originating posts are
		// tracked by the client
		if (!this.forInboundEmail && !this.forIntegration) {
			return;
		}
		// check if user has opted out
		const preferences = this.user.get('preferences') || {};
		if (preferences.telemetryConsent === false) { // note: undefined is not an opt-out, so it's opt-in by default
			return ;
		}

		const endpoint = this.forInboundEmail ? 'Email' :
			this.forIntegration.charAt(0).toUpperCase() + this.forIntegration.slice(1);
		const categories = {
			'channel': 'Channel',
			'direct': 'DM',
			'file': 'Source File'
		};
		const category = categories[this.stream.get('type')] || '???';
		const trackObject = {
			distinct_id: this.user.id,
			Type: 'Chat',
			Thread: 'Parent',
			Category: category,
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
	}

	// for unregistered users who are mentioned, we track that they've been mentioned
	// and how many times for analytics purposes
	async updateMentions () {
		await this.getMentionedUsers();
		await this.updateMentionedUsers();
	}

	// get any mentioned users so we can tell who is unregistered
	async getMentionedUsers () {
		const userIds = this.attributes.mentionedUserIds || [];
		if (userIds.length === 0) {
			return;
		}
		this.mentionedUsers = await this.data.users.getByIds(
			userIds,
			{
				noCache: true,
				fields: ['_id', 'isRegistered']
			}
		);
	}

	// for unregistered users who are mentioned, we track that they've been mentioned
	// and how many times for analytics purposes
	async updateMentionedUsers () {
		await Promise.all((this.mentionedUsers || []).map(async user => {
			await this.updateMentionsForUser(user);
		}));
	}

	// for an unregistered mentioned user, we track that they've been mentioned
	// and how many times for analytics purposes
	async updateMentionsForUser (user) {
		if (user.get('isRegistered')) {
			return ;	// we only do this for unregistered users
		}
		const update = {
			$set: {
				internalMethod: 'mention_notification',
				internalMethodDetail: this.user.id
			},
			$inc: {
				numMentions: 1
			}
		};
		await this.data.users.updateDirect(
			{ _id: this.data.users.objectIdSafe(user.id) },
			update
		);
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

// this file injects CodeStream related functionality into the generic socket cluster server

'use strict';

const MongoClient = require('./server_utils/mongo/mongo_client');
const Config = require('./config');
const SimpleFileLogger = require('./server_utils/simple_file_logger');

class CodeStream {

	constructor (scWorker) {
		this.scWorker = scWorker;
		this.socketsByUidAndChannel = {};
		this.uidsBySocketId = {};
		this.uidsByTeamChannel = {};
		this.addMiddlware();
		this.addConnectionListeners();
		this.logger = new SimpleFileLogger(Config.logger);
		this.connectToMongo();
	}

	// add middleware, which acts on socket cluster events
	addMiddlware () {
		const { scServer } = this.scWorker;

		// respond to channel subscribe event
		scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, (request, next) => {
			this.onSubscribe(request, next);
		});
	}

	// add listeners to a socket connection
	addConnectionListeners () {
		const { scServer } = this.scWorker;
		scServer.on('connection', this.addSocketListeners.bind(this));
	}

	// whenever a channel is subscribed to...
	async onSubscribe (request, next) {
		const { socket, channel } = request;
		const { authToken } = socket;
		if (!authToken) {
			return next('missing credentials');
		}
		const { uid } = authToken;

		// authorize the subscription, fail out if an error string is returned
		const reason = await this.authorizeSubscribe(uid, channel);
		if (reason) {
			return next(`not authorized for channel ${channel}: ${reason}`);
		}

		// keep track of mappings between sockets, channels, and user IDs
		this.socketsByUidAndChannel[uid] = this.socketsByUidAndChannel[uid] || {};
		const uidSockets = this.socketsByUidAndChannel[uid];
		uidSockets[channel] = uidSockets[channel] || [];
		uidSockets[channel].push(socket);

		this.uidsBySocketId[socket.id] = uid;

		// also keep track of users subscribed to team channels, which helps with presence
		if (channel.startsWith('team-')) {
			this.uidsByTeamChannel[channel] = this.uidsByTeamChannel[channel] || [];
			if (!this.uidsByTeamChannel[channel].includes(uid)) {
				this.uidsByTeamChannel[channel].push(uid);
			}
		}

		next();
	}

	// authorize an attempt to subscribe to a channel
	async authorizeSubscribe (uid, channel) {
		if (!this.data) { return; }
		let user;
		try {
			// get the user data associated with this subscription
			user = await this.data.users.getById(uid);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Unable to fetch user: ${message}`);
			throw 'internal data error';
		}
		if (!user || user.deactivated) {
			return 'user not found';
		}

		// authorize according to the channel type
		const parts = channel.split('-');
		if (parts[0] === 'stream') {
			return await this.authorizeStream(user, parts[1]);
		}

		if (parts[0] === 'user') {
			// users can only subscribe to their own channel
			if (parts[1] !== uid) {
				return 'user mismatch';
			}
		}
		else if (parts[0] === 'team') {
			return this.authorizeTeam(user, parts[1]);
		}
		else {
			return 'invalid channel';
		}
	}

	// authorize a user's attempt to subscribe to a stream channel
	async authorizeStream (user, streamId) {
		let stream;
		try {
			// get the stream
			stream = await this.data.streams.getById(streamId);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Unable to fetch stream: ${message}`);
			throw 'internal data error';
		}
		if (
			stream.type === 'file' ||
			(
				stream.type === 'channel' &&
				stream.isTeamStream
			)
		) {
			// file-type streams and team streams are authorized per the team
			return this.authorizeTeam(user, stream.teamId);
		}
		else if (!(stream.memberIds || []).includes(user._id)) {
			// otherwise the user must be a member of the stream
			return 'user not in stream';
		}
	}

	// authorize the user for access to a team-related channel
	authorizeTeam (user, teamId) {
		// user must be in the team
		if (!(user.teamIds || []).includes(teamId)) {
			return 'user not in team';
		}
	}

	// add listeners to various custom socket events
	addSocketListeners (socket) {

		// authorize a connection
		socket.on('auth', data => {
			this.handleAuth(socket, data);
		});

		// desubscribe a socket from a channel (initiated by the API server)
		socket.on('desubscribe', data => {
			this.handleDesubscribe(socket, data);
		});

		// unsubscribe from a channel (initiated by the client)
		socket.on('unsubscribe', data => {
			this.handleUnsubscribe(socket, data);
		});

		// get the message history for a particular socket
		socket.on('getHistory', request => {
			this.getHistory(socket, request);
		});

		// get the users currently subscribed to a team channel
		socket.on('getSubscribedUsers', request => {
			this.getSubscribedUsers(socket, request);
		});

		// handle an incoming message
		socket.on('message', data => {
			this.handleMessage(socket, data);
		});
	}
	
	// handle an client trying to authorize their socket connection
	async handleAuth (socket, data) {
		if (!data.token) {
			return socket.emit('error', new Error('AuthError: no auth token provided'));
		}
		if (!data.uid) {
			return socket.emit('error', new Error('AuthError: no uid provided'));
		}
		try {
			await this.validateToken(data.token, data.uid, data.subscriptionCheat);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			return socket.emit('error', new Error(`AuthError: ${message}`));
		}

		// all good, set the token for the socket and emit an 'authed' event letting the
		// client know they are actually authed
		socket.setAuthToken({ uid: data.uid });
		socket.emit('authed');
	}

	// validate a token associated with a socket connection
	async validateToken (token, uid, subscriptionCheat) {
		if (!this.data) { throw 'not connected to db'; }

		// API connections are special and require a secret
		if (uid === 'API' && token === Config.secrets.api) {
			return;
		}

		let user;
		try {
			// get the user associated with the token
			user = await this.data.users.getById(uid);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Unable to fetch user: ${message}`);
			throw 'internal data error';
		}
		if (!user || user.deactivated) {
			throw 'user not found';
		}

		// verify the provided token matches their stored token
		if (token !== user.broadcasterToken) {
			// special condition for integration tests
			if (subscriptionCheat === Config.secrets.subscriptionCheat) {
				this.warn('NOTE: Allowing subscription with user ID, this had better be a test!!!');
			}
			else {
				throw 'invalid token';
			}
		}
	}

	// connect to the mongo database
	async connectToMongo () {
		this.mongoClient = new MongoClient({ tryIndefinitely: true });
		const collections = ['users', 'streams', 'messages'];
		let mongoConfig = Object.assign({}, Config.mongo, { collections, logger: this });
		try {
			await this.mongoClient.openMongoClient(mongoConfig);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Unable too open mongo client: ${message}`);
			throw 'internal database error';
		}
		return this.mongoClient;
	}

	// handle a de-subscribe request from the server ... this is a forced de-subscribe 
	// for the sockets associated with a user to no longer be subscribed to a given channel
	handleDesubscribe (socket, data) {
		// this request is only allowed from the server
		if (!this.isServerSocket(socket)) {
			return;
		}

		// look for all sockets associated with the user and the channel
		const { userId, channel } = data;
		const uidSockets = this.socketsByUidAndChannel[userId];
		if (uidSockets) {
			const sockets = uidSockets[channel];
			if (sockets) {
				// kick the user out of this channel on these sockets
				for (const userSocket of sockets) {
					userSocket.kickOut(channel);
				}
			}
		}
	}

	// handle a request to unsubscribe from a channel, initiated by the client
	handleUnsubscribe (socket, channel) {
		// get the user ID associated with this socket
		const uid = this.uidsBySocketId[socket.id];

		// remove knowledge of this user being subscribed to this channel 
		if (this.socketsByUidAndChannel[uid]) {
			delete this.socketsByUidAndChannel[uid][channel];
		}

		// if the channel is a team channel, remove knowledge of this user being subscribed
		if (channel.startsWith('team-') && this.uidsByTeamChannel[channel]) {
			const index = this.uidsByTeamChannel[channel].indexOf(uid);
			if (index !== -1) {
				this.uidsByTeamChannel[channel].splice(index, 1);
			}
		}
	}

	// handle an incoming message
	async handleMessage (socket, data) {
		// messages can only come from the server
		if (!this.data || !this.isServerSocket(socket)) { return; }
		try {
			data = JSON.parse(data);
		}
		catch (error) {
			return;
		}
		data = data.data;
		if (!data.channel || !data.data) { 
			return;
		}

		// remove any lingering old messages
		this.sweepOldMessages();
		
		if (typeof data.data === 'object') {
			this.normalizeMessage(data.data);
		}

		// store the message in our message history for the channel
		const message = {
			timestamp: Date.now(),
			channel: data.channel,
			message: data.data
		};
		try {
			await this.data.messages.create(message);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Error handling socket message: ${message}`);
		}
	}

	// recursively normalize the message for storage,
	// since mongo documents can not contain '.' or '$' as keys
	normalizeMessage (message) {
		for (const key in message) {
			let newKey = key;
			newKey = newKey.replace(/\./g, '*');
			if (newKey.startsWith('$')) {
				newKey = `!${newKey.slice(1)}`;
			}
			if (key !== newKey) {
				message[newKey] = message[key];
				delete message[key];
			}
			if (message[newKey] instanceof Array) {
				for (const elem of message[newKey]) {
					if (typeof elem === 'object') {
						this.normalizeMessage(elem);
					}
				}
			}
			else if (typeof message[newKey] === 'object') {
				this.normalizeMessage(message[newKey]);
			}

		}
	}

	// remove old messages from the message history
	sweepOldMessages () {
		const now = Date.now();
		const cutoff = now - Config.history.retentionPeriod;
		const query = {
			timestamp: { $lt: cutoff }
		};
		if (!this.lastSweep || this.lastSweep < now - Config.history.sweepPeriod) {
			this.data.messages.deleteByQuery(query);
		}
		this.lastSweep = now;
	}

	// get the message history for the given set of channels and a given socket
	async getHistory (socket, request) {
		if (!this.data) { return; }
		try {
			let { channels } = request;
			const { requestId, since } = request;

			// only serve history in slices of 100 channels
			if (channels.length > 100) {
				channels = channels.slice(0, 100);
			}
			channels = channels.filter((channel, index, arr) => arr.indexOf(channel) === index);

			// authorize fetching this history
			const error = await this.authChannelsHistory(socket, channels);
			if (error) {
				this.warn(`Auth history request ${requestId} failed: ${error}`);
				return socket.emit('history', { requestId, error });
			}

			const query = {
				channel: { $in: channels },
				timestamp: { $gte: since }
			};
			const messages = await this.data.messages.getByQuery(
				query,
				{
					hint: { channels: 1, timestamp: 1},
					sort: { timestamp: -1},
					limit: 100
				}
			);

			// denormalize the messages and emit them as a history message
			this.denormalizeMessages(messages);
			socket.emit('history', {
				requestId,
				channels: request.channels,
				messages
			});
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`History request ${request.requestId} failed unexpectedly: ${message}`);
			socket.emit('history', {
				requestId: request.requestId,
				channels: request.channels,
				error: 'internal error'
			});
		}
	}

	// get users subscribed to a team channel
	async getSubscribedUsers (socket, request) {
		try {
			const { channel, requestId } = request;

			// this request is only allowed from the server
			if (!this.isServerSocket(socket)) {
				this.warn(`Auth getSubscribedUsers request ${requestId} failed: not a server socket`);
				return socket.emit('subscribedUsers', { requestId, error: 'access denied' });
			}

			const userIds = this.uidsByTeamChannel[channel] || [];
			socket.emit('subscribedUsers', { requestId, userIds });
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`getSubscribedUsers request ${request.requestId} failed unexpectedly: ${message}`);
			socket.emit('subscribedUsers', {
				requestId: request.requestId,
				error: 'internal error'
			});
		}
	}

	// denormalize messages stored on mongo, since mongo does not allow '.' or '$' as keys
	denormalizeMessages (messages) {
		for (let message of messages) {
			delete message._id;
			delete message.version;
			this.denormalizeMessage(message);
		}
	}

	// recursively denormalize a mongo document as a message,
	// since mongo does not allow '.' or '$' as keys
	denormalizeMessage (message) {
		for (const key in message) {
			let newKey = key;
			newKey = newKey.replace(/\*/g, '.');
			if (newKey.startsWith('!')) {
				newKey = `$${newKey.slice(1)}`;
			}
			if (key !== newKey) {
				message[newKey] = message[key];
				delete message[key];
			}
			if (message[key] instanceof Array) {
				for (const elem of message[key]) {
					this.denormalizeMessage(elem);
				}
			}
			else if (typeof message[key] === 'object') {
				this.denormalizeMessage(message[key]);
			}
		}
	}

	// authorize a request to fetch message history for a given set of channels
	async authChannelsHistory (socket, channels) {
		// get the user associated with the socket
		const user = await this.getSocketUser(socket);
		if (!user) { 
			return 'socket not authenticated, or user not found';
		}

		// categorize by channel type
		const channelInfo = this.categorizeChannels(channels);
		if (!channelInfo) {
			return 'invalid channels';
		}

		// only the user can get access to their user channel
		let unauthedChannel = channelInfo.userChannels.find(channel => channel !== `user-${user._id}`);
		if (unauthedChannel) {
			return `unauthorized user channel: ${unauthedChannel}`;
		}

		// users must be a member of the team channels
		unauthedChannel = channelInfo.teamChannels.find(channel => {
			return !user.teamIds.includes(channel.split('team-')[1]);
		});
		if (unauthedChannel) {
			return `unauthorzed team channel: ${unauthedChannel}`;
		}
		
		// stream channels are authorized separately
		return await this.authStreamChannelsHistory(channelInfo.streamChannels, user);
	}

	// authorize a request to fetch message history for a given set of stream channels
	async authStreamChannelsHistory (channels, user) {
		if (channels.length === 0) {
			return;
		}
		if ((user.teamIds || []).length === 0) {
			return 'unauthorized stream channel(s)';
		}

		// fetch the streams
		const streamIds = channels.map(channel => channel.split('stream-')[1]);
		const streams = await this.data.streams.getByIds(streamIds);
		if (streams.length !== streamIds.length) {
			return 'some streams not found';
		}

		// stream channels are authorized if they are file or team streams for a team the user is in,
		// or they are for a stream the user is in
		if (streams.find(stream => {
			return (
				!user.teamIds.includes(stream.teamId) || 
				(
					stream.type !== 'file' &&
					!stream.isTeamStream &&
					!(stream.memberIds || []).includes(user._id)
				)
			);
		})) {
			return `unauthorized channel: stream-${stream._id}`;
		}
	}

	// is this socket a connection to the API server?
	isServerSocket (socket) {
		const token = socket.getAuthToken();
		if (!token) {
			return false;
		}
		return token.uid === 'API';
	}

	// get the user associated with a given socket
	async getSocketUser (socket) {
		const token = socket.getAuthToken();
		if (!token) { 
			return null;
		}
		return await this.data.users.getById(token.uid);
	}

	// categorize channels by type: user, team, and stream
	categorizeChannels (channels) {
		const channelInfo = {
			userChannels: [],
			teamChannels: [],
			streamChannels: []
		};
		for (const channel of channels) {
			if (channel.startsWith('user-')) {
				channelInfo.userChannels.push(channel);
			}
			else if (channel.startsWith('team-')) {
				channelInfo.teamChannels.push(channel);
			}
			else if (channel.startsWith('stream-')) {
				channelInfo.streamChannels.push(channel);
			}
			else {
				return false;
			}
		}
		return channelInfo;
	}

	log (message) {
		this.logger.log(message);
	}

	warn (message) {
		this.logger.warn(message);
	}
}

module.exports = CodeStream;

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

	addMiddlware () {
		const { scServer } = this.scWorker;
		scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, (request, next) => {
			this.onSubscribe(request, next);
		});
	}

	addConnectionListeners () {
		const { scServer } = this.scWorker;
		scServer.on('connection', this.addSocketListeners.bind(this));
	}

	async onSubscribe (request, next) {
		const { socket, channel } = request;
		const { authToken } = socket;
		if (!authToken) {
			return next('missing credentials');
		}
		const { uid } = authToken;

		const reason = await this.authorizeSubscribe(uid, channel);
		if (reason) {
			return next(`not authorized for channel ${channel}: ${reason}`);
		}

		this.socketsByUidAndChannel[uid] = this.socketsByUidAndChannel[uid] || {};
		const uidSockets = this.socketsByUidAndChannel[uid];
		uidSockets[channel] = uidSockets[channel] || [];
		uidSockets[channel].push(socket);

		this.uidsBySocketId[socket.id] = uid;

		if (channel.startsWith('team-')) {
			this.uidsByTeamChannel[channel] = this.uidsByTeamChannel[channel] || [];
			if (!this.uidsByTeamChannel[channel].includes(uid)) {
				this.uidsByTeamChannel[channel].push(uid);
			}
		}

		next();
	}

	async authorizeSubscribe (uid, channel) {
		if (!this.data) { return; }
		let user;
		try {
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

		const parts = channel.split('-');
		if (parts[0] === 'stream') {
			return await this.authorizeStream(user, parts[1]);
		}

		if (parts[0] === 'user') {
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

	async authorizeStream (user, streamId) {
		let stream;
		try {
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
			return this.authorizeTeam(user, stream.teamId);
		}
		else if (!(stream.memberIds || []).includes(user._id)) {
			return 'user not in stream';
		}
	}

	authorizeTeam (user, teamId) {
		if (!(user.teamIds || []).includes(teamId)) {
			return 'user not in team';
		}
	}

	addSocketListeners (socket) {
		socket.on('auth', data => {
			this.handleAuth(socket, data);
		});
		socket.on('desubscribe', data => {
			this.handleDesubscribe(socket, data);
		});
		socket.on('unsubscribe', data => {
			this.handleUnsubscribe(socket, data);
		});
		socket.on('getHistory', request => {
			this.getHistory(socket, request);
		});
		socket.on('getSubscribedUsers', request => {
			this.getSubscribedUsers(socket, request);
		});
		socket.on('message', data => {
			this.handleMessage(socket, data);
		});
	}
	
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
		socket.setAuthToken({ uid: data.uid });
		socket.emit('authed');
	}

	async validateToken (token, uid, subscriptionCheat) {
		if (!this.data) { throw 'not connected to db'; }
		if (uid === 'API' && token === Config.secrets.api) {
			return;
		}
		let user;
		try {
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
		if (token !== user.broadcasterToken) {
			if (subscriptionCheat === Config.secrets.subscriptionCheat) {
				this.warn('NOTE: Allowing subscription with user ID, this had better be a test!!!');
			}
			else {
				throw 'invalid token';
			}
		}
	}

	async connectToMongo () {
		this.mongoClient = new MongoClient();
		const collections = ['users', 'streams', 'messages'];
		let mongoConfig = Object.assign({}, Config.mongo, { collections });
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

	handleDesubscribe (socket, data) {
		if (!this.isServerSocket(socket)) {
			return;
		}
		const { userId, channel } = data;
		const uidSockets = this.socketsByUidAndChannel[userId];
		if (uidSockets) {
			const sockets = uidSockets[channel];
			if (sockets) {
				for (const userSocket of sockets) {
					userSocket.kickOut(channel);
				}
			}
		}
	}

	handleUnsubscribe (socket, channel) {
		const uid = this.uidsBySocketId[socket.id];
		if (this.socketsByUidAndChannel[uid]) {
			delete this.socketsByUidAndChannel[uid][channel];
		}

		if (channel.startsWith('team-') && this.uidsByTeamChannel[channel]) {
			const index = this.uidsByTeamChannel[channel].indexOf(uid);
			if (index !== -1) {
				this.uidsByTeamChannel.splice(index, 1);
			}
		}
	}

	async handleMessage (socket, data) {
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
		this.sweepOldMessages();
		if (typeof data.data === 'object') {
			this.normalizeMessage(data.data);
		}
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

	async getHistory (socket, request) {
		if (!this.data) { return; }
		try {
			let { channels } = request;
			const { requestId, since } = request;

			if (channels.length > 100) {
				channels = channels.slice(0, 100);
			}
			channels = channels.filter((channel, index, arr) => arr.indexOf(channel) === index);

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

	async getSubscribedUsers (socket, request) {
		try {
			const { channel, requestId } = request;
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

	denormalizeMessages (messages) {
		for (let message of messages) {
			delete message._id;
			delete message.version;
			this.denormalizeMessage(message);
		}
	}

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

	async authChannelsHistory (socket, channels) {
		const user = await this.getSocketUser(socket);
		if (!user) { 
			return 'socket not authenticated, or user not found';
		}

		const channelInfo = this.categorizeChannels(channels);
		if (!channelInfo) {
			return 'invalid channels';
		}

		let unauthedChannel = channelInfo.userChannels.find(channel => channel !== `user-${user._id}`);
		if (unauthedChannel) {
			return `unauthorized user channel: ${unauthedChannel}`;
		}

		unauthedChannel = channelInfo.teamChannels.find(channel => {
			return !user.teamIds.includes(channel.split('team-')[1]);
		});
		if (unauthedChannel) {
			return `unauthorzed team channel: ${unauthedChannel}`;
		}
		
		return await this.authStreamChannelsHistory(channelInfo.streamChannels, user);
	}

	async authStreamChannelsHistory (channels, user) {
		if (channels.length === 0) {
			return;
		}
		if ((user.teamIds || []).length === 0) {
			return 'unauthorized stream channel(s)';
		}
		const streamIds = channels.map(channel => channel.split('stream-')[1]);
		const streams = await this.data.streams.getByIds(streamIds);
		if (streams.length !== streamIds.length) {
			return 'some streams not found';
		}

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

	isServerSocket (socket) {
		const token = socket.getAuthToken();
		if (!token) {
			return false;
		}
		return token.uid === 'API';
	}

	async getSocketUser (socket) {
		const token = socket.getAuthToken();
		if (!token) { 
			return null;
		}
		return await this.data.users.getById(token.uid);
	}

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

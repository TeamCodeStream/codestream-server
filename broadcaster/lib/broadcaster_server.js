// Provides a broadcaster server which accepts pub/sub connections 
// and broadcasts messages, mirroring PubNub for on-prem installations

'use strict';

const HTTPS = require('https');
const HTTP = require('http');
const FS = require('fs');
const SocketClusterServer = require('socketcluster-server');
const UUID = require('uuid/v4');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client');
const getAssetInfo = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/get_asset_data');
const OS = require('os');
const Express = require('express');
const IPC = require('node-ipc');

// The BroadcasterServer is instantiated via the cluster wrapper.
// Options are passed through from the ClusterWrapper() call made in the
// main block.
//
// These options are required and are promoted to first class properties
// of the server object:
//   config: the global configuration
//   logger: a simple_file_logger object
//
// Other options (serverOptions):
//   dontListen: true will prevent calling the startListening() method
class BroadcasterServer {

	constructor (options = {}) {
		this.serverOptions = options;
		this.config = options.config || {};
		this.logger = options.logger || console;
		this.socketsByUserId = {};
		this.userIdsByTeamChannel = {};
		this.numOpenRequests = 0;
		this.express = Express();
		this.ipcRequestInfo = {};
	}

	// start 'er up
	async start () {
		this.log('Starting up...');
		this.workerId = 1;
		this.setListeners();
		await this.connectToMongo();
		if (this.config.apiServer.mockMode) {
			this.connectToIpc();
		}
		if (!this.serverOptions.dontListen) {
			await this.startListening();
		}
	}

	// set relevant event listeners from master process
	setListeners () {
		process.on('message', this.handleMasterMessage.bind(this));
	}

	// connect to the mongo database
	async connectToMongo () {
		this.log('Connecting to mongo...');
		const collections = ['users', 'streams', 'messages'];
		this.mongoClient = new MongoClient({ 
			tryIndefinitely: true,
			collections,
			logger: this
		});
		try {
			await this.mongoClient.openMongoClient(this.config.storage.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Unable to open mongo client: ${message}`);
			throw 'internal database error';
		}
		return this.mongoClient;
	}

	// connect to IPC in mock mode (for test running)
	connectToIpc (callback) {
		IPC.config.id = this.config.apiServer.ipc.broadcastServerId;
		IPC.config.silent = true;
		IPC.connectTo(this.config.apiServer.ipc.serverId, () => {
			IPC.of[this.config.apiServer.ipc.serverId].on('response', this.handleIpcResponse.bind(this));
		});
		this.ipc = IPC;
	}

	// handle a request response over IPC, for mock mode
	handleIpcResponse (response) {
		const info = this.ipcRequestInfo[response.clientRequestId];
		if (!info) { return; }
		const { options, callback } = info;
		delete this.ipcRequestInfo[response.clientRequestId];
		if (response.statusCode !== 200) {
				return callback(`error response, status code was ${response.statusCode}`, response.data, response);
		}
		else {
			return callback(null, response.data, response);
		}
	}

	// start listening for messages
	async startListening () {
		const ignoreHttps = this.config.broadcastEngine.codestreamBroadcaster.ignoreHttps;
		const socketClusterOptions = {
			authKey: this.config.broadcastEngine.codestreamBroadcaster.secrets.auth
		};
		const options = ignoreHttps ? {} : this.makeHttpsOptions();
		const protocol = ignoreHttps ? HTTP : HTTPS;
		const httpsServer = protocol.createServer(options, this.express);
		this.scServer = SocketClusterServer.attach(httpsServer, socketClusterOptions);

		if (ignoreHttps) {
			this.log('Broadcaster not using SSL');
		}
		this.log(`Broadcaster listening on port ${this.config.broadcastEngine.codestreamBroadcaster.port.toString()}`);
		httpsServer.listen(this.config.broadcastEngine.codestreamBroadcaster.port.toString());

		this.express.get('/no-auth/status', ((req, res) => {
			res.send('OK');
		}));

		this.express.get('/no-auth/asset-info', async (req, res) => {
			res.send(await getAssetInfo());
		});

		// start listening for connections
		(async () => {
			for await (let { socket } of this.scServer.listener('connection')) {
				const requestId = UUID();
				this.log('Client connected', socket, requestId);
				this.addSocketProc('auth', this.handleAuth, socket);
				this.addSocketListener('disconnect', this.handleDisconnect, socket);
				this.addSocketListener('error', this.handleError, socket);
				this.addSocketListener('warning', this.handleWarning, socket);
			}
		})();

		// listen for errors
		(async () => {
			for await (let { error } of this.scServer.listener('error')) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				this.warn(`Listener error: ${message}`);
			}
		})();

		// listen for subscriptions
		this.scServer.setMiddleware(this.scServer.MIDDLEWARE_INBOUND, async middlewareStream => {
			for await (let action of middlewareStream) {
				const requestId = UUID();
				if (action.type === action.SUBSCRIBE) {
					this.onSubscribe(action, requestId);
				}
				else {
					action.allow();
				}
			}
		});
	}

	// adds a socket RPC procedure to listen for on a particular socket
	addSocketProc (name, handler, socket) {
		(async () => {
			for await (let request of socket.procedure(name)) {
				const requestId = UUID();
				try {
					this.bumpRequests();
					const response = await handler.call(this, request.data, socket, requestId);
					request.end(response);
					this.debumpRequests();
				}
				catch (error) {
					this.debumpRequests();
					let requestError;
					if (error instanceof Error) {
						this.warn(`socket proc error: ${error.message}\n${error.stack}`, socket, requestId);
						requestError = new Error('internal error');
					}
					else {
						requestError = new Error(error);
					}
					this.warn(`${requestError.message}`, socket, requestId);
					request.error(requestError);
				}
			}
		})();
	}

	// add a receiver to a socket connection
	addSocketReceiver (name, handler, socket) {
		(async () => {
			for await (let data of socket.receiver(name)) {
				const requestId = UUID();
				this.bumpRequests();
				handler.call(this, data, socket, requestId);
				this.debumpRequests();
			}
		})();
	}

	// add an event listener to a socket connection
	addSocketListener (name, handler, socket) {
		(async () => {
			for await (let data of socket.listener(name)) {
				const requestId = UUID();
				this.bumpRequests();
				handler.call(this, data, socket, requestId);
				this.debumpRequests();
			}
		})();
	}

	// handle disconnect event for a given socket
	handleDisconnect (data, socket, requestId) {
		this.log(`Disconnected: ${data.reason}`, socket, requestId);
		if (this.isServerSocket(socket)) {
			this.warn('API server disconnected!', socket, requestId);
			return;
		}
		this.purgeSocket(socket, requestId);
	}

	// purge knowledge of this socket from local caches
	purgeSocket (socket, requestId) {
		const userId = this.getSocketUserId(socket);
		if (!userId) { return; }
		const sockets = this.socketsByUserId[userId];
		if (!sockets) { return; }
		const index = sockets.findIndex(userSocket => userSocket.id === socket.id);
		if (index !== -1) {
			sockets.splice(index, 1);
		}
		if (sockets.length === 0) {
			this.purgeUser(userId, socket, requestId);
		}
	}

	// a user has closed their last socket, so purge knowledge of this user from local caches
	async purgeUser (userId, socket, requestId) {
		this.log(`Last socket for user ${userId}`, socket, requestId);
		const user = await this.getData('users', 'getById', userId);
		if (!user) { return; }
		for (let teamId of user.teamIds || []) {
			const userArray = this.userIdsByTeamChannel[`team-${teamId}`];
			if (userArray) {
				const index = userArray.indexOf(userId);
				if (index !== -1) {
					userArray.splice(index, 1);
				}
			}
		}
	}

	// handle an error on a given socket
	handleError (data, socket, requestId) {
		this.log(`socket error: ${JSON.stringify(data)}`, socket, requestId);
	}

	// handle a warning on a given socket
	handleWarning (data, socket, requestId) {
		this.log(`socket warning: ${JSON.stringify(data)}`, socket, requestId);
	}

	// handle a client trying to authorize their socket connection
	async handleAuth (data, socket, requestId) {
		if (!data.token) {
			throw 'AuthError: no auth token provided';
		}
		if (!data.uid) {
			throw 'AuthError: no uid provided';
		}
		const { token, uid, subscriptionCheat } = data;
		this.log(`Received auth request from ${uid}`, socket, requestId);

		try {
			// validate the token
			await this.validateToken(token, uid, subscriptionCheat);
			this.log(`User ${uid} authorized`, socket, requestId);
			socket.setAuthToken({ uid });
			this.addSocketListener('disconnect', this.handleDisconnect, socket);
			if (this.isServerSocket(socket)) {
				// when this socket is the API server, respond to these things
				this.addSocketReceiver('message', this.handleMessage, socket);
				this.addSocketProc('desubscribe', this.handleDesubscribe, socket);
				this.addSocketListener('getSubscribedUsers', this.getSubscribedUsers, socket);
			}
			else {
				// when this socket is a CodeStream client, respond to these things
				this.addSocketProc('history', this.getHistory, socket);
				this.addSocketListener('unsubscribe', this.handleUnsubscribe, socket);
				this.socketsByUserId[uid] = this.socketsByUserId[uid] || [];
				this.socketsByUserId[uid].push(socket);
			}
		}
		catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			else {
				throw `AuthError: ${error}`;
			}
		}
	}

	// validate a token associated with a socket connection
	async validateToken (token, uid, subscriptionCheat) {
		// API connections are special and require a secret
		if (uid === 'API' && token === this.config.broadcastEngine.codestreamBroadcaster.secrets.api) {
			return;
		}

		let user;
		try {
			// get the user associated with the token
			user = await this.getData('users', 'getById', uid);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw `unable to fetch user: ${message}`;
		}
		if (!user || user.deactivated) {
			throw `user ${uid} not found`;
		}

		// verify the provided token matches their stored token
		if (token !== user.broadcasterToken) {
			// special condition for integration tests
			if (subscriptionCheat === this.config.sharedSecrets.subscriptionCheat) {
				this.warn('NOTE: Allowing subscription with user ID, this had better be a test!!!');
			}
			else {
				throw 'invalid token';
			}
		}
	}

	// called when a user subscribes to a channel
	userSubscribedToChannel (userId, channel) {
		// if the user is subscribing to a team channel, we keep track of it,
		// which allows us to report to interested parties which users are online for a given team
		if (channel.startsWith('team-')) {
			this.userIdsByTeamChannel[channel] = this.userIdsByTeamChannel[channel] || [];
			if (!this.userIdsByTeamChannel[channel].includes(userId)) {
				this.userIdsByTeamChannel[channel].push(userId);
			}
		}
	}

	// handle a request to unsubscribe from a channel, initiated by the client
	handleUnsubscribe (data, socket, requestId) {
		const { channel } = data;
		this.log(`Request to unsubscribe from ${channel}`, socket, requestId);
		this.socketUnsubscribedFromChannel(socket, channel, requestId);
	}

	// called when a user unsubscribes from a channel on a particular socket connection 
	socketUnsubscribedFromChannel (socket, channel, requestId) {
		// if the channel is a team channel, remove knowledge of this user being subscribed
		if (channel.startsWith('team-') && this.userIdsByTeamChannel[channel]) {
			const userId = this.getSocketUserId(socket);
			if (!userId) { return; }
			const index = this.userIdsByTeamChannel[channel].indexOf(userId);
			if (index !== -1) {
				this.log(`Removing user ${userId} from those subscribed to team channel ${channel}`, socket, requestId);
				this.userIdsByTeamChannel[channel].splice(index, 1);
			}
		}
	}

	// handle a de-subscribe request from the server ... this is a forced de-subscribe 
	// for the sockets associated with a user to no longer be subscribed to a given channel,
	// initiated from the API server
	handleDesubscribe (data, socket, requestId) {
		const { userId, channel } = data;
		this.log(`Request to desubscribe user ${userId} from ${channel}`, socket, requestId);

		// look for all sockets associated with the user and the channel
		const sockets = this.socketsByUserId[userId] || [];

		// kick the user out of this channel on all sockets
		for (const userSocket of sockets) {
			this.log(`Kicking user ${userId} out of channel ${channel} on socket ${userSocket.id}`, socket, requestId);
			userSocket.kickOut(channel);
		}
	}

	// whenever a channel is subscribed to...
	// we can block or allow it based on the user's access permissions
	async onSubscribe (action, requestId) {
		const { socket, channel } = action;
		const { authToken } = socket;
		this.log(`Request to subscribe to ${channel}`, socket, requestId);
		if (!authToken) {
			const error = new Error('missing credentials');
			this.log(`Request blocked: ${error.message}`, socket, requestId);
			return action.block(error);
		}
		const { uid } = authToken;

		if (!this.isServerSocket(socket)) {
			// authorize the subscription, fail out if an error string is returned
			const reason = await this.authorizeSubscribe(uid, channel);
			if (reason) {
				const error = new Error(`not authorized for channel ${channel}: ${reason}`);
				this.log(`Request blocked: ${error.message}`, socket, requestId);
				return action.block(error);
			}
		}

		// keep track of mappings between channels and user IDs
		this.userSubscribedToChannel(uid, channel);

		this.log(`User ${uid} subscribed to ${channel}`, socket, requestId);
		action.allow();
	}

	// authorize an attempt to subscribe to a channel
	async authorizeSubscribe (uid, channel) {
		let user;
		try {
			// get the user data associated with this subscription
			user = await this.getData('users', 'getById', uid);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			return `unable to fetch user: ${message}`;
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
			stream = await this.getData('streams', 'getById', streamId);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			return `unable to fetch stream: ${message}`;
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

	// handle an incoming message
	async handleMessage (data, socket, requestId) {
		const { channel, message } = data;
		if (!channel || !message) { return; }
		const messageId = (typeof message === 'object' && message.messageId) || '???';
		this.log(`Received message ${messageId} for channel ${channel}`, socket, requestId);

		// pass the message on to clients listening to this channel
		this.scServer.exchange.transmitPublish(channel, message);

		// remove any lingering old messages
		this.sweepOldMessages();
		
		// messages must be normalized for storage on mongo, which prevents certain characters in keys
		if (typeof message === 'object') {
			this.normalizeMessage(message);
		}

		// store the message in our message history for the channel
		const storedMessage = {
			timestamp: Date.now(),
			channel: channel,
			message: message
		};
		try {
			await this.data.messages.create(storedMessage);
		}
		catch (error) {
			const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Error handling socket message ${messageId}: ${errorMessage}`, socket, requestId);
		}
 
		this.log(`Message ${messageId} transmitted and stored for ${channel}`, socket, requestId);
	}
		
	// get the message history for the given set of channels and a given socket
	async getHistory (data, socket, serverRequestId) {
		const { channels, requestId, since } = data;
		this.log(`History request received for channels ${JSON.stringify(channels)}`, socket, serverRequestId);

		// authorize fetching this history
		const error = await this.authChannelsHistory(socket, channels);
		if (error) {
			throw `history request ${requestId} not authorized: ${error}`;
		}

		// get messages since the cutoff
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

		// denormalize the messages and return them as a history message
		this.denormalizeMessages(messages);
		this.log(`${messages.length} messages returned for history of ${channels}`, socket, requestId);
		return {
			requestId,
			channels,
			messages
		};
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
		const streams = await this.getData('streams', 'getByIds', streamIds);
		if (streams.length !== streamIds.length) {
			return 'some streams not found';
		}

		// stream channels are authorized if they are file or team streams for a team the user is in,
		// or they are for a stream the user is in
		const offendingStream = streams.find(stream => {
			return (
				!user.teamIds.includes(stream.teamId) || 
				(
					stream.type !== 'file' &&
					!stream.isTeamStream &&
					!(stream.memberIds || []).includes(user._id)
				)
			);
		});
		if (offendingStream) {
			return `unauthorized channel: stream-${offendingStream._id}`;
		}
	}

	// remove old messages from the message history, clients looking for history
	// older than the retention period should to a full reload instead
	sweepOldMessages () {
		const now = Date.now();
		const cutoff = now - this.config.broadcastEngine.codestreamBroadcaster.history.retentionPeriod;
		const query = {
			timestamp: { $lt: cutoff }
		};
		if (!this.lastSweep || this.lastSweep < now - this.config.broadcastEngine.codestreamBroadcaster.history.sweepPeriod) {
			if (!this.data || !this.data.messages) {
				return;
			}
			this.data.messages.deleteByQuery(query);
		}
		this.lastSweep = now;
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

	// get users subscribed to a team channel
	async getSubscribedUsers (data, socket, serverRequestId) {
		const { channel, requestId } = data;
		const userIds = this.userIdsByTeamChannel[channel] || [];
		this.log(`Request for subscribed users on channel ${channel} returning ${userIds}`, socket, serverRequestId);
		return { requestId, userIds };
	}

	// is this socket a connection to the API server?
	isServerSocket (socket) {
		const token = socket.getAuthToken();
		if (!token) {
			return false;
		}
		return token.uid === 'API';
	}

	// get the user ID associated with a given socket
	getSocketUserId (socket) {
		const token = socket.getAuthToken();
		if (!token) { 
			return null;
		}
		return token.uid;
	}

	// get the user associated with a given socket
	async getSocketUser (socket) {
		const userId = this.getSocketUserId(socket);
		if (!userId) {
			return null;
		}
		return await this.getData('users', 'getById', userId);
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

	// stop listening for messages
	stopListening () {
	}

	// make https options, so we know how to listen to requests over https
	makeHttpsOptions () {
		const options = {};
		// read in key and cert file
		if (
			this.config.ssl &&
			this.config.ssl.keyfile &&
			this.config.ssl.certfile
		) {
			try {
				options.key = FS.readFileSync(this.config.ssl.keyfile);
			}
			catch (error) {
				throw 'could not read private key file: ' + this.config.ssl.keyfile + ': ' + error;
			}
			try {
				options.cert = FS.readFileSync(this.config.ssl.certfile);
			}
			catch (error) {
				throw 'could not read certificate file: ' + this.config.ssl.certfile + ': ' + error;
			}
			if (this.config.ssl.cafile) {
				let caCertificate;
				try {
					caCertificate = FS.readFileSync(this.config.ssl.cafile);
				}
				catch (error) {
					throw 'could not read certificate chain file: ' + this.config.ssl.cafile + ': ' + error;
				}
				options.ca = caCertificate;
			}
		}
		return options;
	}
  
	// get data from storage ... ordinarily obtained from mongo, but for mock mode running tests,
	// we request the data over IPC from the api server
	async getData (collection, func, value) {
		if (!this.config.apiServer.mockMode) {
			return this.data[collection][func](value);
		}

		const clientRequestId = UUID();
		const params = {
			secret: this.config.broadcastEngine.codestreamBroadcaster.secrets.api,
			collection,
			func,
			data: value
		};
		const query = Object.keys(params).map(key => {
			return `${key}=${encodeURIComponent(params[key])}`;
		}).join('&');
		const path = `/mock-data?${query}`;

		return new Promise((resolve, reject) => {
			const message = {
				method: 'get',
				path,
				clientRequestId
			};
			const callback = (error, data) => {
				if (error) {
					reject(error);
				}
				else {
					resolve(data);
				}
			}
			this.ipcRequestInfo[clientRequestId] = { callback };
			this.ipc.of[this.config.apiServer.ipc.serverId].emit('request', message);
		});
	}

	// handle a message from the master
	handleMasterMessage (message) {
		if (typeof message !== 'object') { return; }
		if (message.shutdown) {
			// master is making us shut down, whether gracefully or not
			this.shutdown();
		}
		else if (message.wantShutdown) {
			// master wants us to shut down, but is giving us the chance to do it gracefully
			this.wantShutdown(message.signal || 'signal');
		}
		else if (message.youAre) {
			// master is telling us our worker ID and helping us identify ourselves in the logs
			this.workerId = message.youAre;
			if (this.logger && this.logger.setLoggerId) {
				this.logger.setLoggerId('W' + this.workerId);
			}
			process.on('SIGINT', () => {});
			process.on('SIGTERM', () => {});
		}
	}

	// forced shutdown ... boom!
	shutdown () {
		if (this.shuttingDown) { return; }
		this.shuttingDown = true;
		setTimeout(() => {
			process.exit(0);
		}, 100);
	}

	// master wants us to shutdown, but is giving us the chance to finish all open
	// tasks first ... if the master sends another signal within five seoncds,
	// we're going to commit suicide regardless ... meanie master
	wantShutdown (signal) {
		if (this.numOpenRequests && !this.killReceived) {
			// we've got some open requests, and no additional commands to die
			this.critical(`Worker ${this.workerId} received ${signal}, waiting for ${this.numOpenRequests} requests to finish, send ${signal} again to kill`);
			this.killReceived = true;
			// give the user 5 seconds to force-kill us, otherwise their chance to do so expires
			setTimeout(
				() => {
					this.killReceived = false;
					this.start();	// start watching again, false alarm
				},
				5000
			);
			this.stopListening();
			this.shutdownPending = true;
		}
		else {
			if (this.numOpenRequests) {
				// the user is impatient, we'll die even though we have open tasks
				this.critical(`Worker ${this.workerId} received ${signal}, shutting down despite ${this.numOpenRequests} open requests...`);
			}
			else {
				// we have no open tasks, so we can just die
				this.critical(`Worker ${this.workerId} received ${signal} and has no open tasks, shutting down...`);
			}
			// seppuku
			this.shutdown();
		}
	}

	// bump the number of open requests
	bumpRequests () {
		this.numOpenRequests++;
	}

	// a request has finished, keep track and honor shutdown if no more open requests
	debumpRequests () {
		this.numOpenRequests--;
		if (this.numOpenRequests === 0) {
			this.noMoreRequests();
		}
	}

	// signal that there are currently no open socket connections
	noMoreRequests () {
		// if there is a shutdown pending (the master commanded us to shutdown, but is allowing all sockets to close),
		// then since there are no more open socket connections, we can just die
		if (this.shutdownPending) {
			this.critical(`Worker ${this.workerId} has no more open requests, shutting down...`);
			this.shutdown();
		}
	}

	critical (message, socket, requestId) {
		this._log(message, 'critical', socket, requestId);
	}

	error (message, socket, requestId) {
		this._log(message, 'error', socket, requestId);
	}

	warn (message, socket, requestId) {
		this._log(message, 'warn', socket, requestId);
	}

	log (message, socket, requestId) {
		this._log(message, 'log', socket, requestId);
	}

	_log (message, func, socket, requestId) {
		if (!this.logger) {
			return; 
		}
		if (!this.logger[func]) {
			func = 'log';
		}
		if (!this.logger[func]) {
			return;
		}

		requestId = requestId || 'NOREQ';
		const isApi = socket ? (this.isServerSocket(socket) ? '(API)' : '') : '';
		const header = socket ? `${socket.id}${isApi}: ` : '';
		message = `${header}${requestId} ${message}`;
		this.logger[func](message);
	}
}

module.exports = BroadcasterServer;

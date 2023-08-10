// Provides an outbound email server which listens to a queue service and processes
// outbound emails for CodeStream

'use strict';

const NewRelic = require('newrelic');
const OutboundEmailServerConfig = require('./config');  // structured config object
const AWS = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aws/aws');
const SQSClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aws/sqs_client');
const RabbitMQClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/rabbitmq');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client.js');
const EmailNotificationV2Handler = require('./emailNotificationV2Handler');
const OS = require('os');
const PubNub = require('pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const SocketClusterClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/socketcluster/socketcluster_client');
const EmailSender = require('./emailSender');
const ConfirmationEmailHandler = require('./confirmationEmailHandler');
const AlreadyRegisteredEmailHandler = require('./alreadyRegisteredEmailHandler');
const ChangeEmailConfirmationHandler = require('./changeEmailConfirmationHandler');
const InviteEmailHandler = require('./inviteEmailHandler');
const ResetPasswordEmailHandler = require('./resetPasswordEmailHandler');
const TeamCreatedEmailHandler = require('./teamCreatedEmailHandler');
const WeeklyEmailHandler = require('./weeklyEmailHandler');
const LoginCodeHandler = require('./loginCodeHandler');
const TryIndefinitely = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/try_indefinitely');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const FS = require('fs');
const UUID = require('uuid').v4;

const MONGO_COLLECTIONS = ['users', 'teams', 'companies', 'repos', 'streams', 'posts', 'codemarks', 'reviews', 'codeErrors', 'markers'];

const HANDLERS = {
	confirm: ConfirmationEmailHandler,
	alreadyRegistered: AlreadyRegisteredEmailHandler,
	changeEmail: ChangeEmailConfirmationHandler,
	invite: InviteEmailHandler,
	resetPassword: ResetPasswordEmailHandler,
	teamCreated: TeamCreatedEmailHandler,
	notification_v2: EmailNotificationV2Handler,
	weekly: WeeklyEmailHandler,
	loginCode: LoginCodeHandler
};

// The OutboundEmailServer is instantiated via the cluster wrapper.
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
class OutboundEmailServer {

	constructor (options = {}) {
		this.serverOptions = options;
		this.config = options.config || {};
		this.logger = options.logger || console;
	}

	// start 'er up
	async start () {
		this.log('starting, dontListen=' + this.serverOptions.dontListen);
		this.workerId = 1;
		this.numOpenTasks = 0;
		await this.setListeners();
		await this.initAsNeeded();
		if (!this.serverOptions.dontListen) {
			this.log('starting to listen');
			await this.startListening();
		}
	}

	// set relevant event listeners
	setListeners () {
		process.on('message', this.handleMasterMessage.bind(this));
	}

	// start listening for messages
	async startListening () {
		this.log(`Trying to listening to ${this.config.queuingEngine[this.config.queuingEngine.selected].outboundEmailQueueName}...`);
		await this.queuer.listen({
			name: this.config.queuingEngine[this.config.queuingEngine.selected].outboundEmailQueueName,
			handler: (this.serverOptions.messageHandler || this.processMessage).bind(this)
		});
		this.log(`Successfully listening to ${this.config.queuingEngine[this.config.queuingEngine.selected].outboundEmailQueueName}...`);
	}

	// stop listening for messages
	stopListening () {
		this.queuer.stopListening(this.config.queuingEngine[this.config.queuingEngine.selected].outboundEmailQueueName);
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

	// respond to lambda function call
	async lambda (event) {
		try {
			this.log('lambda event:', JSON.stringify(event, 0, 5));
			if (event.Records instanceof Array) {
				await Promise.all(event.Records.map(async record => {
					let body;
					try {
						body = JSON.parse(record.body);
					}
					catch (error) {
						this.warn('Could not parse record body: ', JSON.stringify(error));
						return;
					}
					await this.processMessage(body);
				}));
			}
			else {
				await this.processMessage(event);
			}
		}
		catch (error) {
			this.warn('Error processing lambda event:', JSON.stringify(error));
		}
	}


	/**
	 * process an incoming message
	 * 
	 * @param {object} message    - message to be processed
	 * @param {func} callback     - callback functionnode-osx-latest
	 */
	async processMessage (message, requestId, callback) {
		if (callback) { 
			callback(true);
		}
		requestId = requestId || UUID();
		await this.initAsNeeded();
		const emailHandlerClass = HANDLERS[message.type];
		if (!emailHandlerClass) {
			this.warn(`No email handler for type ${message.type}`, requestId);
			return;
		}
		this.numOpenTasks++;
		if(await OutboundEmailServerConfig.isDirty()) {
			this.log('reloading config data - cache is dirty', requestId);
			this.config = await OutboundEmailServerConfig.loadPreferredConfig();
			if (OutboundEmailServerConfig.restartRequired()) {
				this.log('new config requires a restart or full re-initialization', requestId);
				// uh oh!
			}
		}
		const handlerOptions = {
			logger: this.logger,
			data: this.data,
			broadcaster: this.broadcaster,
			queuer: this.queuer,
			sender: this.emailSender,
			styles: this.styles,
			pseudoStyles: this.pseudoStyles,
			outboundEmailServer: this,
			requestId
		};

		// pass trace headers with the message, for distributed tracing of
		// api server to outbound email
		//await new emailHandlerClass(handlerOptions).handleMessage(message);
		
		NewRelic.startWebTransaction('outboundEmail', async () => {
			const transaction = NewRelic.getTransaction();
			await new emailHandlerClass(handlerOptions).handleMessage(message);
			transaction.end();
		});	
		

		this.numOpenTasks--;
		if (this.numOpenTasks === 0 && this.killReceived) {
			this.shutdown();
		} 
	}
	
	async initAsNeeded () {
		if (this.inited) { return; }
		await awaitParallel([
			this.openMongoClient,
			// use of broadcaster is disabled for now, it is not current needed
			// this.openBroadcasterClient, 
			this.openQueuer,
			this.readStyles
		], this);
		this.log('Service connections successful');
		this.makeEmailSender();
		this.inited = true;
		this.log('Initialization complete');
	}
	
	async openMongoClient () {
		this.log('Opening connection to mongo...');
		const mongoClient = new MongoClient({
			tryIndefinitely: true,
			logger: this,
			collections: MONGO_COLLECTIONS
		});
		try {
			this.mongo = await mongoClient.openMongoClient(this.config.outboundEmailServer.storage.mongo);
		}
		catch (error) {
			const msg = error instanceof Error ? error.message : JSON.stringify(error);
			this.error('Unable to open mongo client: ' + msg);
			process.exit();
		}
		this.data = this.mongo.mongoCollections;
		this.log('Successfully connected to mongo');
	}
	
	async openBroadcasterClient () {
		if (this.config.broadcastEngine.selected === 'codestreamBroadcaster') {
			return await this.openSocketClusterClient();
		}
		else {
			return await this.openPubnubClient();
		}	
	}

	async openPubnubClient () {
		this.log('Opening connection to Pubnub...');
		const pubnubOptions = Object.assign({}, this.config.broadcastEngine.pubnub);
		pubnubOptions.uuid = 'OutboundEmail-' + OS.hostname();
		this.log('pubnub options:', JSON.stringify(pubnubOptions, 0, 5));
		const pubnub = new PubNub(pubnubOptions);
		await TryIndefinitely(async () => {
			try {
				this.log('trying to publish test message...');
				await pubnub.publish({ message: 'test', channel: 'test' });
				this.log('published test message');
			}
			catch (error) {
				const msg = error instanceof Error ? error.message : JSON.stringify(error);
				const stat = typeof error === 'object' ? error.status : '';
				this.warn(`Failed to connect to PubNub: ${msg}\n${JSON.stringify(stat)}`);
				throw error;
			}
		}, 5000, this, 'Unable to connect to PubNub, retrying...');
		this.broadcaster = new PubNubClient({ pubnub });
		this.log('Successfully connected to Pubnub');
	}
	
	async openSocketClusterClient () {
		this.log('Opening connection to SocketCluster...');
		const broadcasterConfig = this.config.broadcastEngine.codestreamBroadcaster;
		const config = Object.assign({},
			{
				// formerly the socketCluster object
				host: broadcasterConfig.host,
				port: broadcasterConfig.port,
				authKey: broadcasterConfig.secrets.api,
				ignoreHttps: broadcasterConfig.ignoreHttps,
				strictSSL: broadcasterConfig.sslCert.requireStrictSSL,
				apiSecret: broadcasterConfig.secrets.api
			},
			{
				logger: this,
				uid: 'API',
				authKey: this.config.broadcastEngine.codestreamBroadcaster.secrets.api
			}
		);
		this.broadcaster = new SocketClusterClient(config);
		await TryIndefinitely(async () => {
			await this.broadcaster.init();
			await this.broadcaster.publish('test', 'test');
		}, 5000, this, 'Unable to connect to SocketCluster, retrying...');
		this.log('Successfully connected to SocketCluster');
	}
		
	async openQueuer () {
		if (this.config.queuingEngine.selected === 'rabbitmq') {
			await this.openRabbitMQ();
		}
		else {
			await this.openSQS();
		}
	}
	
	async openRabbitMQ () {
		this.log('Opening connection to RabbitMQ...');
		const { user, password, host, port } = this.config.queuingEngine.rabbitmq;
		const config = {
			host: `amqp://${user}:${password}@${host}:${port}`,
			logger: this,
			isPublisher: true
		};
		this.queuer = new RabbitMQClient(config);
		await TryIndefinitely(async () => {
			await this.queuer.init();
			await this.queuer.createQueue({ name: this.config.queuingEngine.rabbitmq.outboundEmailQueueName });
		}, 1000, this, 'Unable to connect to RabbitMQ, retrying...');
		this.queuerIsRabbitMQ = true;
		this.log('Successfully connected to RabbitMQ');
	}

	async openSQS () {
		this.log('Opening connection to SQS...');
		const aws = new AWS(this.config.queuingEngine.awsSQS);
		this.queuer = new SQSClient({ aws, logger: this.logger });
		await TryIndefinitely(async () => {
			await this.queuer.createQueue({ name: this.config.queuingEngine.awsSQS.outboundEmailQueueName });
		}, 1000, this, 'Unable to connect to SQS, retrying...');
		this.log('Successfully connected to SQS');
	}

	async readStyles () {
		this.styles = await new Promise((resolve, reject) => {
			FS.readFile('./src/styles.css', 'utf8', (error, data) => {
				if (error) reject(error);
				else resolve(data);
			});
		});
		this.pseudoStyles = await new Promise((resolve, reject) => {
			FS.readFile('./src/pseudoStyles.css', 'utf8', (error, data) => {
				if (error) reject(error);
				else resolve(data);
			});
		});
	}

	makeEmailSender () {
		this.emailSender = new EmailSender({
			logger: this.logger,
			broadcaster: this.broadcaster,
			outboundEmailServer: this
		});
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
		if (this.numOpenTasks && !this.killReceived) {
			// we've got some open tasks, and no additional commands to die
			this.critical(`Worker ${this.workerId} received ${signal}, waiting for ${this.numOpenTasks} tasks to complete, send ${signal} again to kill`);
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
			if (this.numOpenTasks) {
				// the user is impatient, we'll die even though we have open tasks
				this.critical(`Worker ${this.workerId} received ${signal}, shutting down despite ${this.numOpenTasks} open requests...`);
			}
			else {
				// we have no open tasks, so we can just die
				this.critical(`Worker ${this.workerId} received ${signal} and has no open tasks, shutting down...`);
			}
			// seppuku
			this.shutdown();
		}
	}

	// signal that there are currently no open tasks
	noMoreTasks () {
		// if there is a shutdown pending (the master commanded us to shutdown, but is allowing all tasks to finish),
		// then since there are no more tasks, we can just die
		if (this.shutdownPending) {
			this.critical(`Worker ${this.workerId} has no more open tasks, shutting down...`);
			this.shutdown();
		}
	}

	critical (message) {
		if (this.logger && typeof this.logger.critical === 'function') {
			this.logger.critical(message);
		}
	}

	error (message) {
		if (this.logger && typeof this.logger.error === 'function') {
			this.logger.error(message);
		}
	}

	warn (message) {
		if (this.logger && typeof this.logger.warn === 'function') {
			this.logger.warn(message);
		}
	}

	log (message) {
		if (this.logger && typeof this.logger.log === 'function') {
			this.logger.log(message);
		}
	}

	debug (message) {
		if (this.logger && typeof this.logger.debug === 'function') {
			this.logger.debug(message);
		}
	}
}

module.exports = OutboundEmailServer;

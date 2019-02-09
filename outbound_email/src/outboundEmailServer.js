// Provides an outbound email server which listens to a queue service and processes
// outbound emails for CodeStream

'use strict';

const AWS = require('./server_utils/aws/aws');
const SQSClient = require('./server_utils/aws/sqs_client');
const RabbitMQClient = require('./server_utils/rabbitmq');
const { callbackWrap } = require('./server_utils/await_utils');
const MongoClient = require('./server_utils/mongo/mongo_client.js');
const EmailNotificationHandler = require('./emailNotificationHandler');
const OS = require('os');
const PubNub = require('pubnub');
const PubNubClient = require('./server_utils/pubnub/pubnub_client_async');
const EmailSender = require('./emailSender');
const ConfirmationEmailHandler = require('./confirmationEmailHandler');
const AlreadyRegisteredEmailHandler = require('./alreadyRegisteredEmailHandler');
const ChangeEmailConfirmationHandler = require('./changeEmailConfirmationHandler');
const InviteEmailHandler = require('./inviteEmailHandler');
const ResetPasswordEmailHandler = require('./resetPasswordEmailHandler');
const TeamCreatedEmailHandler = require('./teamCreatedEmailHandler');

const MONGO_COLLECTIONS = ['users', 'teams', 'repos', 'streams', 'posts', 'codemarks', 'markers'];

class OutboundEmailServer {

	constructor(config) {
		this.config = config;
		if (!config.noLogging) {
			this.logger = this.config.logger || console;
		}
	}

	// start 'er up
	async start () {
		this.workerId = 1;
		this.numOpenTasks = 0;
		await this.setListeners();
		await this.initAsNeeded();
		await this.startListening();
	}

	// set relevant event listeners
	setListeners () {
		process.on('message', this.handleMasterMessage.bind(this));
		process.on('SIGINT', () => {});
		process.on('SIGTERM', () => {});
	}

	// start listening for messages
	async startListening () {
		this.log(`Listening to ${this.config.outboundEmailQueueName}...`);
		await this.queuer.listen({
			name: this.config.outboundEmailQueueName,
			handler: (this.config.messageHandler || this.processMessage).bind(this)
		});
	}

	// stop listening for messages
	stopListening () {
		this.queuer.stopListening(this.config.outboundEmailQueueName);
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
			if (this.config.logger) {
				this.loggerId = 'W' + this.workerId;
				this.config.logger.loggerId = this.loggerId;
				this.config.logger.loggerHost = OS.hostname();
			}
		}
	}

	// respond to lambda function call
	async lambda (event) {
		try {
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

	// process an incoming message
	async processMessage (message, callback) {
		if (callback) { 
			callback(true);
		}
		await this.initAsNeeded();
		if (!this.handlers[message.type]) {
			this.warn(`No email handler for type ${message.type}`);
			return;
		}
		this.numOpenTasks++;
		await this.handlers[message.type].handleMessage(message);
		this.numOpenTasks--;
		if (this.numOpenTasks === 0 && this.killReceived) {
			this.shutdown();
		} 
	}
	
	async initAsNeeded () {
		if (this.handlers) { return; }
		await this.openMongoClient();
		await this.openPubnubClient();
		await this.openQueuer();
		await this.makeEmailSender();
		await this.makeHandlers();
	}
	
	async openMongoClient () {
		this.log('Opening connection to mongo...');
		const mongoClient = new MongoClient();
		const mongoOptions = Object.assign({}, this.config.mongo);
		mongoOptions.collections = MONGO_COLLECTIONS;
		try {
			this.mongo = await mongoClient.openMongoClient(mongoOptions);
		}
		catch (error) {
			this.error('Unable to open mongo client', error);
			process.exit();
		}
		this.data = this.mongo.mongoCollections;
	}
	
	async openPubnubClient () {
		this.log('Opening connection to Pubnub...');
		const pubnubOptions = Object.assign({}, this.config.pubnub);
		pubnubOptions.uuid = 'OutboundEmail-' + OS.hostname();
		const pubnub = new PubNub(pubnubOptions);
		this.pubnub = new PubNubClient({ pubnub });
	}
	
	async openQueuer () {
		if (this.config.rabbitmq && this.config.rabbitmq.host) {
			await this.openRabbitMQ();
		}
		else {
			await this.openSQS();
		}
	}
	
	async openRabbitMQ () {
		this.log('Opening connection to RabbitMQ...');
		const { user, password, host, port } = this.config.rabbitmq;
		const config = {
			host: `amqp://${user}:${password}@${host}:${port}`,
			logger: this,
			isPublisher: true
		};
		this.queuer = new RabbitMQClient(config);
		await this.queuer.init();
		await this.queuer.createQueue({ name: this.config.outboundEmailQueueName });
		this.queuerIsRabbitMQ = true;
	}

	async openSQS () {
		this.log('Opening connection to SQS...');
		const aws = new AWS(this.config.aws);
		this.queuer = new SQSClient({ aws, logger: this.logger });
		await callbackWrap(
			this.queuer.createQueue.bind(this.queuer),
			{
				name: this.config.outboundEmailQueueName
			}
		);
	}

	async makeEmailSender () {
		this.emailSender = new EmailSender({
			logger: this.logger,
			messager: this.pubnub
		});
	}
	
	async makeHandlers () {
		const handlerOptions = {
			logger: this.logger,
			data: this.data,
			messager: this.pubnub,
			queuer: this.queuer,
			sender: this.emailSender
		};
		this.handlers = {
			confirm: new ConfirmationEmailHandler(handlerOptions),
			alreadyRegistered: new AlreadyRegisteredEmailHandler(handlerOptions),
			changeEmail: new ChangeEmailConfirmationHandler(handlerOptions),
			invite: new InviteEmailHandler(handlerOptions),
			resetPassword: new ResetPasswordEmailHandler(handlerOptions),
			teamCreated: new TeamCreatedEmailHandler(handlerOptions),
			notification: new EmailNotificationHandler(handlerOptions)
		};
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

	critical (message, file) {
		if (this.logger && typeof this.logger.critical === 'function') {
			this.logger.critical(message, file);
		}
	}

	error (message, file) {
		if (this.logger && typeof this.logger.error === 'function') {
			this.logger.error(message, file);
		}
	}

	warn (message, file) {
		if (this.logger && typeof this.logger.warn === 'function') {
			this.logger.warn(message, file);
		}
	}

	log (message, file) {
		if (this.logger && typeof this.logger.log === 'function') {
			this.logger.log(message, file);
		}
	}

	debug (message, file) {
		if (this.logger && typeof this.logger.debug === 'function') {
			this.logger.debug(message, file);
		}
	}
}

module.exports = OutboundEmailServer;

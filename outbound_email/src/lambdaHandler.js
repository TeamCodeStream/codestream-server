'use strict';

const Config = require('./config');
const MongoClient = require('./server_utils/mongo/mongo_client.js');
const EmailNotificationHandler = require('./emailNotificationHandler');
const OS = require('os');
const PubNub = require('pubnub');
const PubNubClient = require('./server_utils/pubnub/pubnub_client_async');
const AWSClass = require('./server_utils/aws/aws');
const SQSClientClass = require('./server_utils/aws/sqs_client');
const { callbackWrap } = require('./server_utils/await_utils');
const EmailSenderClass = require('./emailSender');
const ConfirmationEmailHandler = require('./confirmationEmailHandler');
const AlreadyRegisteredEmailHandler = require('./alreadyRegisteredEmailHandler');
const ChangeEmailConfirmationHandler = require('./changeEmailConfirmationHandler');
const InviteEmailHandler = require('./inviteEmailHandler');
const ResetPasswordEmailHandler = require('./resetPasswordEmailHandler');
const TeamCreatedEmailHandler = require('./teamCreatedEmailHandler');

const MONGO_COLLECTIONS = ['users', 'teams', 'repos', 'streams', 'posts', 'markers'];

var AWS = new AWSClass();
var Mongo;
var MongoData;
var Pubnub;
var SQSClient;
var EmailSender;
var Handlers;

exports.handler = async function(event) {
	try {
console.warn('EVENT', event);
		if (event.Records instanceof Array) {
console.warn('processing ' + event.Records.length + ' records...');
			await Promise.all(event.Records.map(async record => {
				let body;
				try {
					body = JSON.parse(record.body);
				}
				catch (error) {
					console.warn('Could not parse record body', error);
					return;
				}
				await ProcessMessage(body);
			}));
		}
		else {
			await ProcessMessage(event);
		}
console.warn('calling back!!!');
//		callback(null, true);
	}
	catch (error) {
		console.warn('Error processing lambda event:', error);
		callback(error);
	}
}
 
async function ProcessMessage (message) {
console.warn('HANDLE...', message);
	await InitAsNeeded();
console.warn('INITED!');
console.warn('handler types are', Object.keys(Handlers || {}));
console.warn('the message is ', message);
console.warn('the message object type is' + typeof message);
console.warn('message.type=' + message.type);
console.warn('Handlers.confirm? ' + (Handlers.confirm ? 'y' : 'n'));
	if (!Handlers[message.type]) {
		console.warn(`No email handler for type ${message.type}`);
		return;
	}
	await Handlers[message.type].handleMessage(message);
/*
	Mongo.close();
	Mongo = null;
	MongoData = null;
*/
console.warn('HANDLED!!!');
}

async function InitAsNeeded () {
	Mongo || await OpenMongoClient();
	Pubnub || await OpenPubnubClient();
	SQSClient || await OpenSQSClient();
	EmailSender || await MakeEmailSender();
console.warn('Handlers?', Object.keys(Handlers || {}));
	Handlers || await MakeHandlers();
}

async function OpenMongoClient () {
console.warn('***** HAVE TO OPEN A MONGO CLIENT ****');
	const mongoClient = new MongoClient();
	const mongoOptions = Object.assign({}, Config.mongo);
	mongoOptions.collections = MONGO_COLLECTIONS;
	Mongo = await mongoClient.openMongoClient(mongoOptions);
	MongoData = Mongo.mongoCollections;
}

async function OpenPubnubClient () {
	const pubnubOptions = Object.assign({}, Config.pubnub);
	pubnubOptions.uuid = 'OutboundEmail-' + OS.hostname();
	const pubnub = new PubNub(pubnubOptions);
	Pubnub = new PubNubClient({ pubnub });
}

async function OpenSQSClient () {
	SQSClient = new SQSClientClass({ aws: AWS });
	await callbackWrap(
		SQSClient.createQueue.bind(SQSClient),
		{
			name: Config.outboundEmailQueueName
		}
	);
}

async function MakeEmailSender () {
	EmailSender = new EmailSenderClass({
		logger: console,
		messager: Pubnub
	});
}

async function MakeHandlers () {
console.warn('*** MAKING HANDLERS...****');
	const handlerOptions = {
		logger: console,
		data: MongoData,
		messager: Pubnub,
		queuer: SQSClient,
		sender: EmailSender
	};
	Handlers = {
		confirm: new ConfirmationEmailHandler(handlerOptions),
		alreadyRegistered: new AlreadyRegisteredEmailHandler(handlerOptions),
		changeEmail: new ChangeEmailConfirmationHandler(handlerOptions),
		invite: new InviteEmailHandler(handlerOptions),
		resetPassword: new ResetPasswordEmailHandler(handlerOptions),
		teamCreated: new TeamCreatedEmailHandler(handlerOptions),
		notification: new EmailNotificationHandler(handlerOptions)
	};
console.warn('HANDLERS ARE', Object.keys(Handlers));
}

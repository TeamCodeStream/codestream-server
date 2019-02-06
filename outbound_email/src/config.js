// general api server configuration

'use strict';

// mongo configuration

'use strict';

// mongo url can come from either a raw supplied url or from individual components,
// where authentication with user and password may or not be relevant
let MongoUrl = process.env.CS_OUTBOUND_EMAIL_MONGO_URL;
if (!MongoUrl) {
	if (process.env.CS_OUTBOUND_EMAIL_MONGO_USER) {
		MongoUrl = `mongodb://${process.env.CS_OUTBOUND_EMAIL_MONGO_USER}:${process.env.CS_OUTBOUND_EMAIL_MONGO_PASS}@${process.env.CS_OUTBOUND_EMAIL_MONGO_HOST}:${process.env.CS_OUTBOUND_EMAIL_MONGO_PORT}/${process.env.CS_OUTBOUND_EMAIL_MONGO_DATABASE}`;
	}
	else {
		MongoUrl = `mongodb://${process.env.CS_OUTBOUND_EMAIL_MONGO_HOST}:${process.env.CS_OUTBOUND_EMAIL_MONGO_PORT}/${process.env.CS_OUTBOUND_EMAIL_MONGO_DATABASE}`;
	}
}

module.exports = {
	// mongo connection configuration
	mongo: {
		host: process.env.CS_OUTBOUND_EMAIL_MONGO_HOST,
		port: process.env.CS_OUTBOUND_EMAIL_MONGO_PORT,
		database: process.env.CS_OUTBOUND_EMAIL_MONGO_DATABASE,
		user: process.env.CS_OUTBOUND_EMAIL_MONGO_USER,
		pass: process.env.CS_OUTBOUND_EMAIL_MONGO_PASS,
		url: MongoUrl,
		hintsRequired: true
	},

	// pubnub connection configuration
	pubnub: {
		publishKey: process.env.CS_OUTBOUND_EMAIL_PUBNUB_PUBLISH_KEY,
		subscribeKey: process.env.CS_OUTBOUND_EMAIL_PUBNUB_SUBSCRIBE_KEY,
		secretKey: process.env.CS_OUTBOUND_EMAIL_PUBNUB_SECRET,
		ssl: true,
		keepAlive: true,
		uuid: 'OutboundEmailServer'
	},

	// sendgrid credentials
	sendgrid: {
		url: '/v3/mail/send',
		apiKey: process.env.CS_OUTBOUND_EMAIL_SENDGRID_SECRET,
		emailTo: process.env.CS_OUTBOUND_EMAIL_TO // redirect emails to this address, for safe testing
	},

	// how often email notifications will be sent per stream
	notificationInterval: parseInt(process.env.CS_OUTBOUND_EMAIL_NOTIFICATION_INTERVAL || 300000, 10), 

	// how long before we call a user "away" from keyboard
	sessionAwayTimeout: parseInt(process.env.CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT || 10 * 60 * 1000, 10),	

	// maximum number of posts in an email notification
	maxPostsPerEmail: 25,

	// we'll send emails from this address	
	senderEmail: process.env.CS_OUTBOUND_EMAIL_SENDER_EMAIL || 'alerts@codestream.com', 

	// email for support
	supportEmail: process.env.CS_OUTBOUND_EMAIL_SUPPORT_EMAIL || 'support@codestream.com', 

	// reply to will be like <streamId>@dev.codestream.com
	replyToDomain: process.env.CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN || 'dev.codestream.com',

	// SQS queue for queueing outbound email messages
	outboundEmailQueueName: process.env.CS_OUTBOUND_EMAIL_SQS,
	
	// logging (for running as a service)
	logging: {
		directory: process.env.CS_OUTBOUND_EMAIL_LOGS,	// put log files in this directory
		basename: 'outbound-email',						// use this for the basename of the log file
		retentionPeriod: 30 * 24 * 60 * 60 * 1000,		// retain log files for this many milliseconds
		consoleOk: process.env.CS_MAILOUT_LOG_CONSOLE_OK // also output to the console
	}
};

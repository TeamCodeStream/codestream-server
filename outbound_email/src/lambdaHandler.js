const Config = require('./config');
const OutboundEmailServer = require('./outboundEmailServer');

var OutboundEmailService;

exports.handler = async function(event) {
	try {
		console.log('GOT AN EVENT: ' + JSON.stringify(event, undefined, 5));
		const config = Object.assign({}, Config, { dontListen: true });
		OutboundEmailService = OutboundEmailService || new OutboundEmailServer(config);
		await OutboundEmailService.start(async error => {
			console.log('SERVICE STARTED');
			if (error) {
				console.error('server failed to start: ' + error); // eslint-disable-line no-console
				process.exit();	
			}
			console.log('CALLING lambda');
			await OutboundEmailService.lambda(event);
			console.log('CALLED lambda');
		});
	}
	catch (error) {
		console.warn('Error processing lambda event:', error);
		throw error;
	}
}
 

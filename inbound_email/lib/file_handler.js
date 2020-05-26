// Handles a single inbound email file, processes it, sends it along to API server
// for posting to the stream

'use strict';

const FS = require('fs');
const URL = require('url');
const MailParser = require('mailparser').MailParser;
const Path = require('path');
const HTTP = require('http');
const HTTPS = require('https');
const HtmlEntities = require('html-entities').AllHtmlEntities;
const InboundEmailServerConfig = require(process.env.CS_MAILIN_TOP + '/config/config');
const { callbackWrap } = require(process.env.CS_MAILIN_TOP + '/server_utils/await_utils');

class FileHandler {

	constructor (options) {
		Object.assign(this, options);
		this.attachments = [];
		this.htmlEntities = new HtmlEntities();
	}

	// handle a single inbound email file
	async handle () {
		let gotError;
		try {
			await this.refreshConfig();				// update configuration data
			await this.waitTillCopyComplete();		// wait till the copy to the new directory is complete
			await this.moveToProcessDirectory();	// move the email file to the "processing" directory
			await this.createTempDirectoryForAttachments(); // create a temporary directory to hold attachment files
			await this.initiateReadStream();		// create a read stream to read the email file from, and start reading
			await this.establishTos();				// establish the true to-addresses that the email was sent to that are recognized for CodeStream
			await this.handleAttachments();			// handle any attachments we found
			await this.deleteAttachmentFiles();		// delete the temporary files for attachments
			await this.extractText();				// extract the actual text from the email, rejecting what we don't want (like original text for replies, and html)
			await this.sendToApiServer();			// send the info along to the API server for posting
		}
		catch (error) {
			gotError = error;
		}
		this.finish(gotError);
	}

	// Load any configuration changes
	async refreshConfig () {
		if(await InboundEmailServerConfig.isDirty()) {
			this.log('reloading config data - cache is dirty');
			this.inboundEmailServer.config = await InboundEmailServerConfig.loadPreferredConfig();
			if (InboundEmailServerConfig.restartRequired()) {
				this.log('new config requires a restart or full re-initialization');
				// uh oh!
			}
		}
	}

	// wait till the copy of the file into the new directory is complete, since watcher alerts us
	// as soon as the file appears ... we'll check every second for the same modified time, and only
	// proceed when it hasn't changed ... let's hope this is adequate
	async waitTillCopyComplete () {
		let lastModTime = 0;
		let i;
		for (i = 0; i < 60; i++) {
			let fileStat;
			await new Promise((resolve, reject) => {
				this.log('Statting ' + this.filePath);
				FS.stat(this.filePath, (error, stat) => {
					if (error) { return reject(error); }
					this.log(`Stat for ${this.filePath}: ${JSON.stringify(stat)}`);
					fileStat = stat;
					resolve();
				});
			});

			const modTime = fileStat.mtime.getTime();
			if (lastModTime && modTime === lastModTime) {
				this.log('File has not changed for 1 second: ' + this.filePath);
				break;
			}
			else {
				lastModTime = modTime;
			}

			await new Promise(resolve => {
				setTimeout(resolve, 1000);
			});
		}
		if (i === 60) {
			throw 'file too big';
		}
		this.log('Will now process ' + this.filePath);
	}

	// move the email file to the "processing" directory,
	// this is what we'll actually work with
	async moveToProcessDirectory () {
		this.baseName = Path.basename(this.filePath);
		this.log(`Processing file: ${this.baseName}`);
		const processDirectory = this.inboundEmailServer.config.inboundEmail.processDirectory;
		this.fileToProcess = Path.join(processDirectory, this.baseName);
		try {
			await callbackWrap(
				FS.rename,
				this.filePath,
				this.fileToProcess
			);
		}
		catch (error) {
			delete this.fileToProcess;
			throw `unable to move email file to process directory: ${error}`;
		}
	}

	// create temp directory for any attachment files
	async createTempDirectoryForAttachments () {
		this.attachmentPath = Path.join(this.inboundEmailServer.config.inboundEmail.tempAttachmentDirectory, this.baseName);
		try {
			await this.ensureDirectory(this.attachmentPath);
		}
		catch (error) {
			delete this.attachmentPath;
			throw `unable to create attachment directory: ${error}`;
		}
	}

	// ensure directory exists
	async ensureDirectory (directory) {
		try {
			await callbackWrap(FS.mkdir, directory);
		}
		catch (error) {
			if (error.code !== 'EEXIST') {
				throw error;
			}
		}
	}

	// create a read stream on the email file and start reading
	async initiateReadStream () {
		return new Promise((resolve, reject) => {
			// we'll callback only when (1) we've parsed the email file and (2)
			// we've processed and saved any attachments
			this.fullyReadResolve = resolve;
			this.fullyReadReject = reject;

			// create the read stream
			const readStream = FS.createReadStream(this.fileToProcess);
			readStream.on('error', error => {
				reject(`error reading email file ${this.fileToProcess}: ${error}`);
			});

			// pipe the output of the read stream into the mail parser
			const mailParser = new MailParser({ streamAttachments: true });
			mailParser.on('error', error => {
				reject(`error parsing email file ${this.fileToProcess}: ${error}`);
			});
			mailParser.on('headers', this.handleHeaders.bind(this));
			mailParser.on('data', this.handleMailData.bind(this));
			mailParser.on('end', this.parseFinished.bind(this));
			readStream.pipe(mailParser);
		});
	}

	// handle headers received from the mail parser
	handleHeaders (headers) {
		this.headers = headers;
	}

	// handle mail data received from the mail parser
	handleMailData (data) {
		// attachment or text...
		if (data.type === 'attachment') {
			this.handleAttachment(data.content);
		}
		else if (data.type === 'text') {
			this.text = data.text;
			this.html = data.html;
		}
	}

	// handle an attachment in the parsed mail stream
	handleAttachment (/*attachment*/) {
		return;	// ignore attachments for now
		// pipe the output of the attachment stream to a temp file
		/*
		let attachmentIndex = this.attachments.length;
		let filename = attachment.filename || `attachment.${attachmentIndex+1}`;
		let attachmentFile = Path.join(this.attachmentPath, filename);
		this.log(`Writing attachment file ${attachmentFile}`);
		let output = FS.createWriteStream(attachmentFile, { encoding: 'binary ' });
		output.on(
			'error',
			error => {
				this.handleAttachmentError(attachmentIndex, error);
			}
		);
		output.on(
			'close',
			() => {
				this.handleAttachmentClose(attachmentIndex);
			}
		);
		this.attachments.push({
			path: attachmentFile,
			parsedAttachment: attachment
		});
		attachment.stream.pipe(output);
		attachment.stream.on('end', () => {
			attachment.release();
		});
		*/
	}

	// handle any errors that occur during attachment streaming
	handleAttachmentError (attachmentIndex, error) {
		// make this attachment as done -- we won't let this error stop us
		// from processing the email body
		let attachmentFile = this.attachments[attachmentIndex].path;
		this.warn(`Error on writing attachment file ${attachmentFile}: ${error}`);
		this.attachments[attachmentIndex].done = true;

		// check if we're done with reading the email
		this.checkFullyRead();	// check if we're done with reading the email
	}

	// handle an attachment being written to a temp file
	handleAttachmentClose (attachmentIndex) {
		// mark this attachment as done
		let attachmentFile = this.attachments[attachmentIndex].path;
		this.log(`Closed attachment file ${attachmentFile}`);
		this.attachments[attachmentIndex].done = true;

		// check if we're done with reading the email
		this.checkFullyRead();
	}

	// if we've parsed the whole mail file, and read in all attachments, we can move on
	// with processing
	checkFullyRead () {
		if (
			this.headers &&
			!this.attachments.find(attachment => !attachment.done)
		) {
			this.fullyReadResolve();
		}
	}

	// called when the parse operation is finished on the email file
	parseFinished () {
		if (this.gotError) {
			return; // short-circuit because we already got an error
		}
		if (
			!this.headers ||
			!this.headers.get('to') ||
			!this.headers.get('from')
		) {
			// could not read an email from this file
			this.fullyReadReject('email rejected because it does not conform to expected format');
		}
		else {
			// we may or may not be done, depending on whether attachments are
			// still being piped to their temp files
			this.checkFullyRead();
		}
	}

	// filter any "to" addresses we can find in the email to those addresses we
	// recognize as bound for our domain ... we only want these and reject all
	// others ... this could include CC's or BCC's, plus X-Original-To (for replies)
	async establishTos () {
		// get all possible "to" address we find in the email header
		const candidateTos = this.getCandidateTos();

		// narrow down to the list of "to" addresses bound for our reply-to domain,
		// ignoring all others
		const approvedTos = this.getApprovedTos(candidateTos);
		if (!approvedTos.length) {
			throw 'email rejected because no CodeStream recipients found';
		}
		this.to = approvedTos;
	}

	// look in the parsed mail object for any possible "to" addresses, these Include
	// CC's, BCC's, X-Original-To, and Delivered-To ... in the case of weird replying
	// and forwarding scenarios, any of these could contain the email address that
	// the user really intended to send to to get the message into CodeStream
	getCandidateTos () {
		return [
			this.headers.get('to'),
			this.headers.get('cc'),
			this.headers.get('bcc'),
			this.headers.get('x-original-to'),
			this.headers.get('delivered-to')
		].reduce((current, value) => {
			if (
				typeof value === 'object' &&
				value.value &&
				value.value instanceof Array
			) {
				current = current.concat(value.value);
			}
			else if (typeof value === 'string') {
				current.push(value);
			}
			return current;
		}, []);
	}

	// based on the candidate "to" addresses, find the ones that match
	getApprovedTos (candidateTos) {
		// form a regex based on our reply-to domain for matching the to address
		const replyToDomain = this.inboundEmailServer.config.inboundEmail.replyToDomain;
		const replyToDomainRegEx = replyToDomain.replace(/\./g, '\\.') + '$';
		const regEx = new RegExp(replyToDomainRegEx);
		let approvedTos = [];

		// search through the candidate "to" address, looking for anything that
		// matches our reply-to regex
		for (let index in candidateTos) {
			let to = candidateTos[index];
			if (typeof to === 'string') {
				to = { address: to };
			}
			if (
				typeof to === 'object' &&
				typeof to.address === 'string' &&
				to.address.match(regEx)
			) {
				approvedTos.push(to);
			}
			else {
				this.log(`Rejecting email address ${JSON.stringify(to)} in ${this.fileToProcess} because it does not match our domain of ${replyToDomain}`);
			}
		}
		return approvedTos;
	}

	// handle any attachments we found in the email
	async handleAttachments () {
		this.attachmentData = [];
		await Promise.all(this.attachments.map(async attachment => {
			await this.handleAttachmentFile(attachment);
		}));
	}

	// handle a single attachment file ... this is a file that was streamed from the
	// mail parser and saved as a temp file ... we'll put that into S3 storage for
	// use by the API server
	async handleAttachmentFile (/*attachment*/) {
		/*
		WHEN WE'RE READY TO DEAL WITH ATTACHMENTS

		// prepare to store on S3
		const size = attachment.parseAttachment.size;
		const basename = Path.basename(attachment.path);
		const filename = FileStorageService.preEncodeFilename(basename);
		const storageTopPath = ''; // When we deal with attachments: this.inboundEmailServer.config.s3.topPath ? (this.inboundEmailServer.config.s3.topPath + '/') : '';
		const timestamp = Date.now();
		const storagePath = `${storageTopPath}/email_files/${timestamp}_${basename}/${filename}`;
		const options = {
			path: attachment.path,
			filename: storagePath
		};

		this.log('Would have handled attachment: ' + JSON.stringify(options));
		// store on S3
		this.FileStorageService.storeFile(
			options,
			(error, storageUrl, downloadUrl, versionId, storagePath) => {
				if (error) {
					this.warn(`Unable to handle attachment ${basename}/${filename} and store file to S3: ${JSON.stringify(error)}`);
				}
				else {
					// this is the data we'll pass on to the API server
					let data = { storageUrl, downloadUrl, versionId, storagePath, size };
					data.lastModified = Date.now();
					this.attachmentData.push(data);
				}
				process.nextTick(callback);
			}
		);
		*/
	}

	// delete the temporary files we created to store attachments, it's all on S3 now
	async deleteAttachmentFiles () {
		const files = this.attachments.map(attachment => attachment.path);
		await Promise.all(files.map(async file => {
			try {
				await callbackWrap(FS.unlink, file);
			}
			catch (error) {
				this.warn(`Unable to delete temp file ${file}: ${error}`);
			}
		}));
		try {
			await callbackWrap(FS.rmdir, this.attachmentPath);
		}
		catch (error) {
			this.warn(`Unable to delete temporary directory ${this.attachmentPath}: ${error}`);
		}
	}

	// extract the text we want from the parsed email text,
	// discarding anything that looks like a quote of the original text for replies,
	// and discarding as much html as we can
	async extractText () {
		let text = '';
		if (typeof this.html === 'string') {
			text = this.textFromHtml(this.html);
		}
		else if (typeof this.text === 'string') {
			text = this.text;
		}
		if (text) {
			text = this.extractReply(text);
		}
		this.text = text;
	}

	// for mail containing html, attempt to extract some useful text from it
	// (we don't want the html going into the post)
	textFromHtml (html) {
		// attempt to parse out some basics here, but mostly ignore the html
		return this.htmlEntities.decode(
			html
				.replace(/<p>(.*?)<\/p>/ig, (match, text) => { return text + '\n'; })
				.replace(/<div>(.*?)<\/div>/ig, (match, text) => { return text + '\n'; })
				.replace(/<br.*?\/?>(\n)?/ig, '\n')
				.replace(/(<([^>]+)>)/ig, '')
				.replace(/&nbsp;/ig, ' ')
		);
	}

	// extract the text we want from the parse email text, discarding anything
	// that looks like a quote of the original text for replies
	extractReply (text) {
		// we'll use a series of regular expressions to look for common reply
		// scenarios ... we'll cut the text off at the nearest match we get in the text
		const productName = 'CodeStream';
		const senderEmail = this.inboundEmailServer.config.inboundEmail.senderEmail;
		const qualifiedEmailRegex = `${senderEmail}\\s*(\\(via ${productName}\\))?\\s*(\\[mailto:.*\\])?`;
		const escapedEmailRegex = qualifiedEmailRegex.replace(/\./, '\\.');
		const regExpArray = [
			new RegExp(`(^_*$)(\n)?From:.*${qualifiedEmailRegex}`, 'im'),
			new RegExp(`(.*)\\(via ${productName}\\)( <${escapedEmailRegex}>)? wrote:\n`),
			new RegExp(`(.*)\\(via ${productName}\\) <(.+)@(.+)>\n`),
			new RegExp(`<${qualifiedEmailRegex}>`, 'i'),
			new RegExp(`${qualifiedEmailRegex}\\s+wrote:`, 'i'),
			new RegExp('^(^\\n)*On.*(\\n)?.*wrote:$', 'im'),
			new RegExp('-+original\\s+message-+\\s*', 'i'),
			new RegExp('--\\s\\n'),	// standard signature separator
		];

		// for each regex, look for a match, our final matching index is the
		// nearest of the matches to the beginning of the text
		const index = regExpArray.reduce(
			(currentIndex, regExp) => {
				let matchIndex = text.search(regExp);
				if (matchIndex !== -1 && matchIndex < currentIndex) {
					return matchIndex;
				}
				else {
					return currentIndex;
				}
			},
			text.length
		);

		// now cut off the reply
		return text.substring(0, index).trim();
	}

	// we've boiled the email down to the crucial pieces of information the
	// API server will need to construct a post out of it ... send the crucial
	// pieces on to the API server and be done with it
	async sendToApiServer () {
		if (!this.text && this.attachmentData.length === 0) {
			// nothing to post, ignore
			throw 'email rejected because no text and no attachments';
		}
		const data = {
			to: this.to,
			from: this.headers.get('from').value[0],
			text: this.text,
			mailFile: this.baseName,
			secret: this.inboundEmailServer.config.secrets.mailSecret,
			attachments: this.attachmentData
		};
		await this.sendDataToApiServer(data);
	}

	// send data regarding an inbound email along to the API server for posting
	// to the stream for which it is intended
	async sendDataToApiServer (data) {
		this.log(`Sending email (${data.mailFile}) from ${JSON.stringify(data.from)} to ${JSON.stringify(data.to)} to API server...`);
		const host = this.inboundEmailServer.config.apiServer.host;
		const port = this.inboundEmailServer.config.apiServer.port;
		const protocol = this.inboundEmailServer.config.apiServer.secure ? 'https' : 'http';
		const netClient = this.inboundEmailServer.config.apiServer.secure ? HTTPS : HTTP;
		const url = `${protocol}://${host}:${port}`;
		const urlObject = URL.parse(url);
		const payload = JSON.stringify(data);
		const headers = {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(payload)
		};
		const requestOptions = {
			host: urlObject.hostname,
			port: urlObject.port,
			path: '/no-auth/inbound-email',
			method: 'POST',
			headers: headers
		};
		return new Promise((resolve, reject) => {
			let request = netClient.request(
				requestOptions,
				response => {
					if (response.statusCode < 200 || response.statusCode >= 300) {
						return reject(`http(s) request to API server failed with status code: ${response.statusCode}`);
					}
					else {
						resolve();
					}
				}
			);
			request.on('error', function(error) {
				return reject(`http(s) request to ${urlObject.hostname}:${urlObject.port} failed: ${error}`);
			});
			request.write(payload);
			request.end();
		});
	}

	// finished processing this file, error or not
	finish (error) {
		if (this.gotError) {
			return; // already processed an error, can just go home
		}
		if (error) {
			this.handleFailure(error);
		}
	}

	// handle a failure to process
	handleFailure (error) {
		this.gotError = true;
		if (this.fileToProcess) {
			// write the error out to an error file, this makes it easy to spot
			const errorFile = this.fileToProcess + '.ERROR';
			FS.writeFile(
				errorFile,
				error,
				writeError => {
					if (writeError) {
						this.warn(`Unable to write to error file on rejection of ${this.baseName}: ${writeError}`);
					}
				}
			);
		}
		this.warn(`Processing of ${this.baseName} failed: ${error}`);
	}

	// warn, adding the basename of the file we are processing
	warn (message) {
		this.inboundEmailServer.warn(message, this.baseName);
	}

	// log, adding the basename of the file we are processing
	log (message) {
		this.inboundEmailServer.log(message, this.baseName);
	}
}

module.exports = FileHandler;

// Handles a single inbound email file, processes it, sends it along to API server
// for posting to the stream

'use strict';

var FS = require('fs');
var URL = require('url');
var BoundAsync = require(process.env.CS_INBOUND_EMAIL_TOP + '/server_utils/bound_async');
var MailParser = require('mailparser').MailParser;
var Path = require('path');
var HTTPS = require('https');
var HtmlEntities = require('html-entities').AllHtmlEntities;

class FileHandler {

	constructor (options) {
		Object.assign(this, options);
		this.attachments = [];
		this.htmlEntities = new HtmlEntities();
	}

	// handle a single inbound email file
	handle (callback) {
		this.finalCallback = callback;
		BoundAsync.series(this, [
			this.moveToProcessDirectory,	// move the email file to the "processing" directory
			this.createTempDirectoryForAttachments, // create a temporary directory to hold attachment files
			this.initiateReadStream,		// create a read stream to read the email file from, and start reading
			this.establishTos,				// establish the true to-addresses that the email was sent to that are recognized for CodeStream
			this.handleAttachments,			// handle any attachments we found
			this.deleteAttachmentFiles,		// delete the temporary files for attachments
			this.extractText,				// extract the actual text from the email, rejecting what we don't want (like original text for replies, and html)
			this.sendToApiServer			// send the info along to the API server for posting
		], this.finish, true);
	}

	// move the email file to the "processing" directory,
	// this is what we'll actually work with
	moveToProcessDirectory (callback) {
		this.baseName = Path.basename(this.filePath);
		this.inboundEmailServer.log(`Processing file: ${this.baseName}`);
		let processDirectory = this.inboundEmailServer.config.inboundEmail.processDirectory;
		this.fileToProcess = Path.join(processDirectory, this.baseName);
		FS.rename(
			this.filePath,
			this.fileToProcess,
			error => {
				if (error) {
					delete this.fileToProcess;
					return callback(`unable to move email file to process directory: ${error}`);
				}
				else {
					return callback();
				}
			}
		);
	}

	// create temp directory for any attachment files
	createTempDirectoryForAttachments (callback) {
		this.attachmentPath = Path.join(this.inboundEmailServer.config.inboundEmail.tempAttachmentDirectory, this.baseName);
		this.ensureDirectory(
			this.attachmentPath,
			error => {
				if (error) {
					delete this.attachmentPath;
					return callback(`unable to create attachment directory: ${error}`);
				}
				else {
					return callback();
				}
			}
		);
	}

	// ensure directory exists
	ensureDirectory (directory, callback) {
	    FS.mkdir(
			directory,
			error => {
				if (
					!error ||
					(error && error.code === 'EEXIST')
				) {
					return callback();
				}
				else {
					return callback(error);
				}
			}
		);
	}

	// create a read stream on the email file and start reading
	initiateReadStream (callback) {
		// we'll callback only when (1) we've parsed the email file and (2)
		// we've processed and saved any attachments
		this.fullyReadCallback = callback;

		// create the read stream
		let readStream = FS.createReadStream(this.fileToProcess);
		readStream.on('error', error => {
			return callback(`error reading email file ${this.fileToProcess}: ${error}`);
		});

		// pipe the output of the read stream into the mail parser
		let mailParser = new MailParser({ streamAttachments: true });
		mailParser.on('error', error => {
			return callback(`error parsing email file ${this.fileToProcess}: ${error}`);
		});
		mailParser.on('headers', this.handleHeaders.bind(this));
		mailParser.on('data', this.handleMailData.bind(this));
		mailParser.on('end', this.parseFinished.bind(this));
		readStream.pipe(mailParser);
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
		}
	}

	// handle an attachment in the parsed mail stream
	handleAttachment (attachment) {
		return;	// ignore attachments for now
		// pipe the output of the attachment stream to a temp file
		let attachmentIndex = this.attachments.length;
		let filename = attachment.filename || `attachment.${attachmentIndex+1}`;
		let attachmentFile = Path.join(this.attachmentPath, filename);
		this.inboundEmailServer.log(`Writing attachment file ${attachmentFile}`);
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
	}

	// handle any errors that occur during attachment streaming
	handleAttachmentError (attachmentIndex, error) {
		// make this attachment as done -- we won't let this error stop us
		// from processing the email body
		let attachmentFile = this.attachments[attachmentIndex].path;
		this.inboundEmailServer.warn(`Error on writing attachment file ${attachmentFile}: ${error}`);
		this.attachments[attachmentIndex].done = true;

		// check if we're done with reading the email
		this.checkFullyRead();	// check if we're done with reading the email
	}

	// handle an attachment being written to a temp file
	handleAttachmentClose (attachmentIndex) {
		// mark this attachment as done
		let attachmentFile = this.attachments[attachmentIndex].path;
		this.inboundEmailServer.log(`Closed attachment file ${attachmentFile}`);
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
			this.fullyReadCallback();
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
			this.fullyReadCallback('email rejected because it does not conform to expected format');
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
	establishTos (callback) {
		// get all possible "to" address we find in the email header
		const candidateTos = this.getCandidateTos();

		// narrow down to the list of "to" addresses bound for our reply-to domain,
		// ignoring all others
		const approvedTos = this.getApprovedTos(candidateTos);
		if (!approvedTos.length) {
			return callback('email rejected because no CodeStream recipients found');
		}
		this.to = approvedTos;
		process.nextTick(callback);
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
				this.inboundEmailServer.log(`Rejecting email address ${JSON.stringify(to)} in ${this.fileToProcess} because it does not match our domain of ${replyToDomain}`);
			}
		}
		return approvedTos;
	}

	// handle any attachments we found in the email
	handleAttachments (callback) {
		this.attachmentData = [];
		BoundAsync.forEachLimit(
			this,
			this.attachments,
			10,
			this.handleAttachmentFile,
			callback
		);
	}

	// handle a single attachment file ... this is a file that was streamed from the
	// mail parser and saved as a temp file ... we'll put that into S3 storage for
	// use by the API server
	handleAttachmentFile (attachment, callback) {
		// prepare to store on S3
		let size = attachment.parseAttachment.size;
		let basename = Path.basename(attachment.path);
		let filename = FileStorageService.preEncodeFilename(basename);
		let storageTopPath = ''; // When we deal with attachments: this.inboundEmailServer.config.s3.topPath ? (this.inboundEmailServer.config.s3.topPath + '/') : '';
		let timestamp = Date.now();
		let storagePath = `${storageTopPath}/email_files/${timestamp}_${basename}/${filename}`;
		let options = {
			path: attachment.path,
			filename: storagePath
		};

		this.log('Would have handled attachment: ' + JSON.stringify(options));
		process.nextTick(callback);
		// store on S3
		/*
		WHEN WE'RE READY TO DEAL WITH ATTACHMENTS
		this.FileStorageService.storeFile(
			options,
			(error, storageUrl, downloadUrl, versionId, storagePath) => {
				if (error) {
					this.inboundEmailServer.warn(`Unable to handle attachment ${basename}/${filename} and store file to S3: ${JSON.stringify(error)}`);
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
	deleteAttachmentFiles (callback) {
		let files = this.attachments.map(attachment => attachment.path);
		BoundAsync.forEachLimit(
			this,
			files,
			10,
			(file, forEachCallback) => {
				FS.unlink(file, error => {
					if (error) {
						this.inboundEmailServer.warn(`Unable to delete temp file ${file}: ${error}`);
					}
					forEachCallback();
				});
			},
			() => {
				FS.rmdir(this.attachmentPath, error => {
					if (error) {
						this.inboundEmailServer.warn(`Unable to delete temporary directory ${dirname}: ${error}`);
					}
					callback();
				});
			}
		);
	}

	// extract the text we want from the parsed email text,
	// discarding anything that looks like a quote of the original text for replies,
	// and discarding as much html as we can
	extractText (callback) {
		let text = '';
		if (typeof this.text === 'string') {
			text = this.text;
		}
		if (!text && typeof this.html === 'string') {
			text = textFromHtml(this.html);
		}
		if (text) {
			text = this.extractReply(text);
		}
		this.text = text;
		process.nextTick(callback);
	}

	// for mail containing html, attempt to extract some useful text from it
	// (we don't want the html going into the post)
	textFromHtml (html) {
		// attempt to parse out some basics here, but mostly ignore the html
		return this.htmlEntities.decode(
			html
				.replace(/<p>(.*?)<\/p>/ig, (match, text) => { return text + '\n'; })
				.replace(/<div>(.*?)<\/div>/ig, (match, text) => { return text + '\n'; })
				.replace(/<br\s*\/?>(\n)?/ig, '\n')
				.replace(/(<([^>]+)>)/ig, '')
				.replace(/&nbsp;/ig, ' ')
		);
	}

	// extract the text we want from the parse email text, discarding anything
	// that looks like a quote of the original text for replies
	extractReply (text) {
		// we'll use a series of regular expressions to look for common reply
		// scenarios ... we'll cut the text off at the nearest match we get in the text
		let productName = 'CodeStream';
		let senderEmail = this.inboundEmailServer.config.inboundEmail.senderEmail;
		var qualifiedEmailRegex = `${senderEmail}\\s*(\\(via ${productName}\\))?\\s*(\\[mailto:.*\\])?`;
		var escapedEmailRegex = qualifiedEmailRegex.replace(/\./, '\\.');
		var regExpArray = [
			new RegExp(`(^_*$)(\n)?From:.*${qualifiedEmailRegex}`, 'im'),
			new RegExp(`(.*)\\(via ${productName}\\)( <${escapedEmailRegex}>)? wrote:\n`),
			new RegExp(`(.*)\\(via ${productName}\\) <(.+)@(.+)>\n`),
			new RegExp(`<${qualifiedEmailRegex}>`, 'i'),
			new RegExp(`${qualifiedEmailRegex}\\s+wrote:`, 'i'),
			new RegExp(`^(^\n)*On.*(\n)?.*wrote:$`, 'im'),
			new RegExp(`-+original\\s+message-+\\s*$`, 'i'),
			new RegExp(`from:\\s*$`, 'i'),
			new RegExp(`-- \n`),	// standard signature separator
			new RegExp(`\\s*From:.*\\(via ${productName}\\)\nSent:.*\nTo:.*\n`)
		];

		// for each regex, look for a match, our final matching index is the
		// nearest of the matches to the beginning of the text
		let index = regExpArray.reduce(
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
	sendToApiServer (callback) {
		if (!this.text && !this.attachmentData) {
			// nothing to post, ignore
			return callback('email rejected because no text and no attachments');
		}
		let data = {
			to: this.to,
			from: this.headers.get('from').value[0],
			text: this.text,
			mailFile: this.baseName,
			aclSecret: this.inboundEmailServer.config.secrets.mailSecret,
			attachments: this.attachmentData
		};
console.warn("DATA", data);
		this.sendDataToApiServer(data, callback);
	}

	// send data regarding an inbound email along to the API server for posting
	// to the stream for which it is intended
	sendDataToApiServer (data, callback) {
		this.inboundEmailServer.log(`Sending email (${data.mailFile}) from ${JSON.stringify(data.from)} to ${JSON.stringify(data.to)} to API server...`);
		let host = this.inboundEmailServer.config.api.host;
		let port = this.inboundEmailServer.config.api.port;
		let url = `https://${host}:${port}`;
		let urlObject = URL.parse(url);
		let payload = JSON.stringify(data);
		let headers = {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(payload)
		};
		let requestOptions = {
			host: urlObject.hostname,
			port: urlObject.port,
			path: '/inbound-email',
			method: 'POST',
			headers: headers
		};
		let request = HTTPS.request(
			requestOptions,
			response => {
				if (response.statusCode < 200 || response.statusCode >= 300) {
					return callback(`https request to API server failed with status code: ${response.statusCode}`);
				}
				else {
					return process.nextTick(callback);
				}
			}
		);
		request.on('error', function(error) {
			return callback(`https request to ${urlObject.hostname}:${urlObject.port} failed: ${error}`);
		});
		request.write(payload);
		request.end();
	}

	// finished processing this file, error or not
	finish (error) {
		if (this.gotError) {
			return; // already processed an error, can just go home
		}
		if (error) {
			this.handleFailure(error);
		}
		else {
			this.finalCallback();
		}
	}

	// handle a failure to process
	handleFailure (error) {
		this.gotError = true;
		if (this.fileToProcess) {
			// write the error out to an error file, this makes it easy to spot
			let errorFile = this.fileToProcess + '.ERROR';
			FS.writeFile(
				errorFile,
				error,
				writeError => {
					if (writeError) {
						this.inboundEmailServer.warn(`Unable to write to error file on rejection of ${this.baseName}: ${writeError}`);
					}
				}
			);
		}
		this.inboundEmailServer.warn(`Processing of ${this.baseName} failed: ${error}`);
		this.finalCallback();
	}
}

module.exports = FileHandler;

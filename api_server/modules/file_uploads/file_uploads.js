// provide a middleware function to handle CORS

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const Multer = require('multer');
const MulterS3 = require('multer-s3');
const UUID = require('uuid/v4');

const ROUTES = [
	{
		method: 'post',
		path: '/upload-file/:teamId',
		requestClass: require('./file_upload_request'),
		describe: 'describeFileUpload'
	}
];

const DEPENDENCIES = [
	'aws',	// need to initialize AWS S3
];

class FileUploads extends APIServerModule {

	async initialize () {
this.api.log('Initializing S3:', JSON.stringify(this.api.config.uploadEngine));
		if (this.api.config.uploadEngine.selected !== 's3') {
			this.api.log('S3 is not the selected upload engine');
			return;
		}
		const { bucket, disableSse } = this.api.config.uploadEngine.s3;
		const options = {
			s3: this.api.services.aws.s3,
			bucket,
			acl: 'public-read', // over my objection :) - Colin
			key: this.makeFilename.bind(this)
		};
		if (!disableSse) {
			options.serverSideEncryption = 'AES256';
		}
		this.multer = Multer({ storage: MulterS3(options) });
	}

	getRoutes () {
		return ROUTES;
	}

	getDependencies () { 
		return DEPENDENCIES;
	}

	middlewares () {
		if (this.api.config.uploadEngine.selected !== 's3') {
			return;
		}
		return [
			(request, response, next) => {
				// only honor this middleware for this path
				if (
					request.method.toLowerCase() !== 'post' ||
					!request.path.match(/^\/upload-file\//)
				) { 
					return next();
				}

				this.upload = this.upload || this.multer.any(request, response, () => {
					next();
				});
				this.upload(request, response, next);
			}
		];
	}

	// callback to generate a filename for a file upload
	makeFilename (request, file, callback) {
		const match = request.path.match(/^\/upload-file\/(.*)$/);
		if (!match || !match[1]) {
			throw 'malformed path';
		}

		const { keyPrefix } = this.api.config.uploadEngine.s3;
		const teamId = match[1].toLowerCase();
		const key = UUID();
		const filename = `${keyPrefix}/${teamId}/${key}/${file.originalname}`;
		return callback(null, filename);
	}

	describeFileUpload () {
		return {
			tag: 'upload-file',
			summary: 'Upload a file',
			description: 'Upload a file and return the URL to access it',
			access: 'User must be a registered user on the team for which the file is being uploaded',
			input: 'Specify the team ID in the path',
			returns: {
				summary: 'An object giving properties of the uploaded file, including the URL to access it',
				looksLike: {
					url: '<URL to access the file>' 
				}
			}
		};
	}
}

module.exports = FileUploads;

// Provide connectivity and basic access to AWS API

const AWS_SDK = require('aws-sdk');

class AWS {

	constructor (options = {}) {
		// initialize AWS SDK module
		// FIXME: NO NO NO NO - we do NOT update the config!!!
		//        Side note: we shouldn't even code the region in here. Let it come from the user's
		//        AWS environment configuration (built into the AWS SDK)
		this.region = options.region || 'us-east-1';
		AWS_SDK.config.update({
			region: this.region
		});
	}

	// get the SQS part of the module
	get sqs () {
		this._sqs = this._sqs || new AWS_SDK.SQS();
		return this._sqs;
	}

	// get the S3 part of the module
	get s3 () {
		this._s3 = this._s3 || new AWS_SDK.S3();
		return this._s3;
	}
}

module.exports = AWS;

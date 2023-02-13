"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeQueue = void 0;
const sqs_consumer_1 = require("./sqs_consumer");
const aws_sdk_1 = require("aws-sdk");
function initializeQueue(options) {
    const client = new aws_sdk_1.SQS();
    const { queueUrl, logger, sqsMessageListener } = options;
    return new sqs_consumer_1.SqsConsumer(queueUrl, logger, sqsMessageListener, client);
}
exports.initializeQueue = initializeQueue;
//# sourceMappingURL=sqs_manager.js.map
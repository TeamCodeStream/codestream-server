"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsConsumer = void 0;
function isString(data) {
    return typeof data === "string";
}
function isAWSError(error) {
    const maybe = error;
    return (isString(maybe.code) && maybe.code.length > 0 && isString(maybe.message));
}
function sleep(timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), timeout);
        });
    });
}
class SqsConsumer {
    constructor(queueUrl, logger, sqsMessageListener, client) {
        this.queueUrl = queueUrl;
        this.logger = logger;
        this.sqsMessageListener = sqsMessageListener;
        this.client = client;
        this.done = false;
    }
    start() {
        try {
            this.consume();
        }
        catch (e) {
            this.logger.error("Error consuming sqs messages", e);
        }
    }
    stop() {
        this.done = true;
    }
    consume() {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this.done) {
                try {
                    this.logger.debug("Polling...");
                    const receiveResponse = yield this.client
                        .receiveMessage({
                        MaxNumberOfMessages: 10,
                        QueueUrl: this.queueUrl,
                        WaitTimeSeconds: 20,
                    })
                        .promise();
                    if (receiveResponse.Messages) {
                        const toDelete = [];
                        this.processMessage(receiveResponse, toDelete);
                        yield Promise.all(toDelete.map((receiptHandle) => {
                            this.client
                                .deleteMessage({
                                QueueUrl: this.queueUrl,
                                ReceiptHandle: receiptHandle,
                            })
                                .promise();
                        }));
                        this.logger.debug(`Deleted ${toDelete.length} messages`);
                    }
                }
                catch (e) {
                    // this.done = true;
                    if (isAWSError(e)) {
                        if (e.code === "ConfigError") {
                            this.logger.warn("Unable to connect to user / org lifecycle sqs queue, messages will not be processed");
                            return;
                        }
                    }
                    this.logger.error(`Error processing SQS messages, retrying in 30 seconds ${e}`);
                    yield sleep(30000);
                }
            }
        });
    }
    processMessage(receiveResponse, toDelete) {
        if (!receiveResponse.Messages) {
            return;
        }
        for (const msg of receiveResponse.Messages) {
            if (!msg.Body || !msg.ReceiptHandle) {
                continue;
            }
            if (!isString(msg.Body)) {
                this.logger.warn("not a string");
                continue;
            }
            const bodyObj = JSON.parse(msg.Body);
            // console.info(msg.Body);
            const innerMessage = bodyObj.Message;
            if (!innerMessage) {
                this.logger.warn("Skipping message with no Body.Message");
                continue;
            }
            const payload = JSON.parse(innerMessage);
            this.logger.info(`Processing ${payload.type}`);
            // TODO add validation
            switch (payload.type) {
                case "organization.update": {
                    this.sqsMessageListener.onOrganizationUpdate(payload);
                    toDelete.push(msg.ReceiptHandle);
                    break;
                }
                case "organization.create": {
                    this.sqsMessageListener.onOrganizationCreate(payload);
                    toDelete.push(msg.ReceiptHandle);
                    break;
                }
                case "user.create": {
                    this.sqsMessageListener.onUserCreate(payload);
                    toDelete.push(msg.ReceiptHandle);
                    break;
                }
                case "user.update": {
                    this.sqsMessageListener.onUserUpdate(payload);
                    toDelete.push(msg.ReceiptHandle);
                    break;
                }
                case "user.delete": {
                    this.sqsMessageListener.onUserDelete(payload);
                    toDelete.push(msg.ReceiptHandle);
                    break;
                }
                // case "user.self_tier_changed": {
                //   this.sqsMessageListener.onUserSelfTierChange(
                //     payload as UserUpdateMessage
                //   );
                //   toDelete.push(msg.ReceiptHandle);
                //   break;
                // }
                // case "user.add_roles": {
                //   this.sqsMessageListener.onUserAddRoles(
                //     payload as UserAddRolesMessage
                //   );
                //   toDelete.push(msg.ReceiptHandle);
                //   break;
                // }
                // case "user.password_changed": {
                //   this.sqsMessageListener.onUserPasswordChanged(payload as UserPasswordChangedMessage);
                //   toDelete.push(msg.ReceiptHandle);
                //   break;
                // }
                default: {
                    this.logger.warn(`Received unhandled message ${payload.type} ${JSON.stringify(payload.data, null, 2)}`);
                }
            }
        }
    }
}
exports.SqsConsumer = SqsConsumer;
//# sourceMappingURL=sqs_consumer.js.map
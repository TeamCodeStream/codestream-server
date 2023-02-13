import { SQS } from "aws-sdk";
import { AWSError } from "aws-sdk/lib/error";
import {
  Logger,
  MessageBody,
  OrganizationUpdateMessage,
  SNSMessage,
  SqsMessageListener,
  UserUpdateMessage,
} from "./types";

function isString(data: unknown): data is string {
  return typeof data === "string";
}

function isAWSError(error: unknown): error is AWSError {
  const maybe = error as AWSError;
  return (
    isString(maybe.code) && maybe.code.length > 0 && isString(maybe.message)
  );
}

async function sleep(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), timeout);
  });
}

export class SqsConsumer {
  private done = false;

  constructor(
    private queueUrl: string,
    private logger: Logger,
    private sqsMessageListener: SqsMessageListener,
    private client: SQS
  ) {}

  start() {
    try {
      this.consume();
    } catch (e) {
      this.logger.error("Error consuming sqs messages", e);
    }
  }

  stop() {
    this.done = true;
  }

  public async consume() {
    while (!this.done) {
      try {
        this.logger.debug("Polling...");
        const receiveResponse = await this.client
          .receiveMessage({
            MaxNumberOfMessages: 10,
            QueueUrl: this.queueUrl,
            WaitTimeSeconds: 20,
          })
          .promise();
        if (receiveResponse.Messages) {
          const toDelete: string[] = [];
          this.processMessage(receiveResponse, toDelete);
          await Promise.all(
            toDelete.map((receiptHandle) => {
              this.client
                .deleteMessage({
                  QueueUrl: this.queueUrl,
                  ReceiptHandle: receiptHandle,
                })
                .promise();
            })
          );
          this.logger.debug(`Deleted ${toDelete.length} messages`);
        }
      } catch (e) {
        // this.done = true;
        if (isAWSError(e)) {
          if (e.code === "ConfigError") {
            this.logger.warn(
              "Unable to connect to user / org lifecycle sqs queue, messages will not be processed"
            );
            return;
          }
        }
        this.logger.error(
          `Error processing SQS messages, retrying in 30 seconds ${e}`
        );
        await sleep(30000);
      }
    }
  }

  public processMessage(
    receiveResponse: SQS.ReceiveMessageResult,
    toDelete: string[]
  ) {
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
      const bodyObj = JSON.parse(msg.Body) as SNSMessage;
      // console.info(msg.Body);
      const innerMessage = bodyObj.Message;
      if (!innerMessage) {
        this.logger.warn("Skipping message with no Body.Message");
        continue;
      }
      const payload = JSON.parse(innerMessage) as MessageBody;
      this.logger.info(`Processing ${payload.type}`);
      // TODO add validation
      switch (payload.type) {
        case "organization.update": {
          this.sqsMessageListener.onOrganizationUpdate(
            payload as OrganizationUpdateMessage
          );
          toDelete.push(msg.ReceiptHandle);
          break;
        }
        case "organization.create": {
          this.sqsMessageListener.onOrganizationCreate(
            payload as OrganizationUpdateMessage
          );
          toDelete.push(msg.ReceiptHandle);
          break;
        }
        case "user.create": {
          this.sqsMessageListener.onUserCreate(payload as UserUpdateMessage);
          toDelete.push(msg.ReceiptHandle);
          break;
        }
        case "user.update": {
          this.sqsMessageListener.onUserUpdate(payload as UserUpdateMessage);
          toDelete.push(msg.ReceiptHandle);
          break;
        }
        case "user.delete": {
          this.sqsMessageListener.onUserDelete(payload as UserUpdateMessage);
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
          this.logger.warn(
            `Received unhandled message ${payload.type} ${JSON.stringify(
              payload.data,
              null,
              2
            )}`
          );
        }
      }
    }
  }
}

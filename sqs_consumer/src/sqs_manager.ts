import { SqsConsumer } from "./sqs_consumer";
import { SQS } from "aws-sdk";
import { Logger, SqsMessageListener } from "./types";

export type Options = {
  queueUrl: string;
  logger: Logger;
  sqsMessageListener: SqsMessageListener;
};

export function initializeQueue(options: Options): SqsConsumer {
  const client = new SQS();
  const { queueUrl, logger, sqsMessageListener } = options;
  return new SqsConsumer(queueUrl, logger, sqsMessageListener, client);
}

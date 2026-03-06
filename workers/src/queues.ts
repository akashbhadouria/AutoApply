import { Queue } from "bullmq";

import { getConnectionOptions } from "./connection.js";
import { queueNames } from "./contracts.js";

const connection = getConnectionOptions();

export const jobScannerQueue = new Queue(queueNames.jobScanner, { connection });
export const referralEngineQueue = new Queue(queueNames.referralEngine, { connection });
export const applicationQueue = new Queue(queueNames.applicationQueue, { connection });
export const browserAutomationQueue = new Queue(queueNames.browserAutomation, { connection });
export const notificationsQueue = new Queue(queueNames.notifications, { connection });

export async function closeQueues() {
  await Promise.all([
    jobScannerQueue.close(),
    referralEngineQueue.close(),
    applicationQueue.close(),
    browserAutomationQueue.close(),
    notificationsQueue.close(),
  ]);
}

// path of this file = "/utils/awsClient.ts"

import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_S3_REGION!,
  endpoint: "https://s3.tebi.io",
});

export default s3;


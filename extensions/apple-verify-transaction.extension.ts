import {
  AppStoreServerAPIClient,
  Environment,
  ReceiptUtility,
} from "@apple/app-store-server-library";
import { readFileSync } from "fs";
import { jwtDecode } from "../libs/jwt";

type AppleVerifyProps = {
  serverVerificationData: string;
};

export async function extensionAppleVerify({
  serverVerificationData,
}: AppleVerifyProps) {
  let privateKey: string;

  if (process.env.ENV === "production") {
    privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  } else {
    const filePath = "secrets/apple.p8";
    privateKey = readFileSync(filePath, "utf8");
  }

  const issuerId = process.env.APPLE_ISSUER_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  const bundleId = process.env.APPLE_BUNDLE_ID!;
  const environment =
    process.env.ENV === "production"
      ? Environment.PRODUCTION
      : Environment.SANDBOX;

  if (!serverVerificationData) {
    throw new Error("Missing server verification data");
  }

  const client = new AppStoreServerAPIClient(
    privateKey,
    keyId,
    issuerId,
    bundleId,
    environment
  );

  const utility = new ReceiptUtility();

  const transactionId = utility.extractTransactionIdFromAppReceipt(
    serverVerificationData
  );

  if (!transactionId) {
    throw new Error("Transaction ID not found");
  }

  const transactionInfo = await client.getTransactionInfo(transactionId);

  const signedTransactionInfo = transactionInfo.signedTransactionInfo;

  const decodedTransactionInfo = jwtDecode(signedTransactionInfo!);

  if (transactionId !== (decodedTransactionInfo as any).transactionId) {
    throw new Error("Transaction ID mismatch");
  }

  return decodedTransactionInfo;
}

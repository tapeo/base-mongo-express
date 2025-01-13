import { JwtPayload } from "jsonwebtoken";
import { jwtDecode } from "../libs/jwt";

type AppleWebhookProps = {
  signedPayload: string;
};

export const extensionAppleWebhook = async ({
  signedPayload,
}: AppleWebhookProps) => {
  const decoded = jwtDecode(signedPayload) as JwtPayload;

  const signedTransactionInfo = decoded?.data.signedTransactionInfo;

  const decodedTransactionInfo = jwtDecode(signedTransactionInfo);

  return decodedTransactionInfo;
};

import axios from "axios";
import fs from "fs";
import { config } from "../sample.config";

interface SendEmailParams {
  email: string;
  text: string;
  subject: string;
  imageFile: Express.Multer.File;
  nameFile: string;
}

export const extensionSendEmail = async ({
  email,
  text,
  subject,
  imageFile,
  nameFile,
}: SendEmailParams) => {
  const html = text.split("\n").join("<br />");
  const base64Image = fs.readFileSync(imageFile.path, {
    encoding: "base64",
  });

  const body = {
    from: { email: config.email, name: config.name },
    to: [{ email: email }],
    subject: subject,
    html,
    attachments: [{ content: base64Image, filename: nameFile }],
  };

  const apiKey = process.env.MAILERSEND_API_KEY;
  const apiUrl = "https://api.mailersend.com/v1/email";

  const response = await axios.post(apiUrl, body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  fs.unlinkSync(imageFile.path);

  return response;
};

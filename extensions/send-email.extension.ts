import fs from "fs";

export interface SendEmailParams {
  from: {
    email: string;
    name: string;
  };
  email: string;
  html: string;
  text: string;
  subject: string;
  imageFile: Express.Multer.File | undefined;
  nameFile: string | undefined;
}

export const extensionSendEmail = async ({
  from,
  email,
  html,
  text,
  subject,
  imageFile,
  nameFile,
}: SendEmailParams) => {
  let attachments: any[] = [];

  if (imageFile) {
    const base64Image = fs.readFileSync(imageFile.path, {
      encoding: "base64",
    });

    attachments = [{ content: base64Image, filename: nameFile }];
  }

  const body = {
    from: { email: from.email, name: from.name },
    to: [{ email: email }],
    subject: subject,
    html,
    text,
    attachments,
  };

  const apiKey = process.env.MAILERSEND_API_KEY;
  const apiUrl = "https://api.mailersend.com/v1/email";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.json();

    throw new Error(
      `Email sending failed response: ${JSON.stringify(
        responseBody
      )}, request: ${JSON.stringify(body)}`
    );
  }

  if (imageFile) {
    fs.unlinkSync(imageFile.path);
  }
};

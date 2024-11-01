import { Storage, UploadResponse } from "@google-cloud/storage";
import path from "path";

type UploadFileParams = {
  bucketName: string;
  imageFile: Express.Multer.File;
  destinationPath: string;
};

export const extensionUploadFileGcp = async ({
  bucketName,
  imageFile,
  destinationPath,
}: UploadFileParams): Promise<string> => {
  let storage;

  if (process.env.ENV === "production") {
    storage = new Storage();
  } else {
    storage = new Storage({
      keyFilename: path.join(__dirname, "../../../secrets/gcp-key.json"),
    });
  }

  const bucket = storage.bucket(bucketName);

  const response: UploadResponse = await bucket.upload(imageFile.path, {
    destination: destinationPath,
    metadata: {
      contentType: imageFile.mimetype,
    },
  });

  const signedUrl = await response[0].getSignedUrl({
    action: "read",
    expires: "03-09-2491",
  });

  return signedUrl[0];
};

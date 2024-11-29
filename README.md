# Usage

## Generate Secrets

1. Copy the `.env.sample` to `.env` and fill in the required values.

```
cp .env.sample .env
```

2. Enable secret manager API

```
gcloud services enable secretmanager.googleapis.com
```

2. Init `gcloud` and select the project or select a project using the following command:

```
gcloud init
gcloud config set project {project-id}
```

3. Fill all the .env files with the required values then run the script `generate-secrets.sh` to generate the secrets.

```
./generate-secrets.sh
```

## Apple (Optional)

Put private key in `secrets/apple.p8` (SubscriptionKey_63T65XFP9S.p8) and update `apple` object in `config.js`.

## Telegram (Optional)

Put the chat id and bot token in the `.env` file.

Set the allowed domains in the `.env` file.

## Upload file (Optional)

Usage of `upload.single("file")` in `app.post`:

```

const upload = multer({ dest: path.join(\_\_dirname, "uploads/") });

app.post(
"/event/:id/upload",
jwtDecodeMiddleware,
upload.single("file"),
uploadFile
);

```

## Run

### Development

```
npm install
npm run dev
```

### Production

#### Cloud Build

Deploy repo to github then create a trigger in cloud build to deploy the app.

```
gcloud builds submit --config cloudbuild.yaml
```

#### Cloud Run

Create a service in cloud run and deploy the image.

```
gcloud run deploy YOUR_SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/YOUR_SERVICE_NAME \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --cpu 1 \
  --memory 128Mi \
  --max-instances 1
```

## MongoDB

1. Allow accesss IP from everywhere to enable Cloud Run to connect to MongoDB.

## HTTPS

```
brew install mkcert
brew install nss # if you use Firefox
mkcert -install
mkcert localhost # or your domain like TeoBook.fritz.box
```

then use `https`:

```
https.createServer({
  key: fs.readFileSync("TeoBook.fritz.box-key.pem"),
  cert: fs.readFileSync("TeoBook.fritz.box.pem"),
}, app).listen(port, host, () => {
```

## Private NPM Registry

```
npm install -g verdaccio
verdaccio
npm run build &&npm pack
```

then copy the package into the `packages` folder of the project and install it:

```
npm install ./packages/backend-1.0.11-beta-1.tgz
```

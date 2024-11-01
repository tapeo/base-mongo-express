import { config } from "dotenv";
config();

import cookieParser from "cookie-parser";
import express, { Express } from "express";
import path from "path";
import { loginHandler } from "./src/controller/auth/login.controller";
import passwordController from "./src/controller/auth/password.controller";
import { refreshTokenHandler } from "./src/controller/auth/refresh-token.controller";
import { signupHandler } from "./src/controller/auth/signup.controller";
import { meHandler } from "./src/controller/user/me.controller";
import { getLocalIpAddress } from "./src/extensions/ip.extension";
import connectDB from "./src/libs/mongo";
import jwtDecodeMiddleware from "./src/middleware/jwt-decode";
import { JsonTyped } from "./src/types/typed-response";

connectDB();

const app: Express = express();
const port = 3000;

app.response.jsonTyped = function (data: JsonTyped) {
  this.json(data);
};

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.post("/login", loginHandler);
app.post("/signup", signupHandler);
app.post("/refresh-token", refreshTokenHandler);
app.post("/password/forgot", passwordController.forgotPassword);
app.get("/password/reset/:token", passwordController.tokenPassword);
app.post("/password/update", passwordController.updatePassword);
app.get("/me", jwtDecodeMiddleware, meHandler);
app.get("/reset-password.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/reset-password.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(
    `[server]: Server is running at http://${getLocalIpAddress()}:${port}`
  );
});

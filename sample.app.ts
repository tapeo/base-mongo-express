/*

import { config } from "dotenv";
config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Express } from "express";
import fs from "fs";
import https from "https";
import path from "path";
import {
  loginHandler,
  logoutHandler,
} from "./base/src/controller/auth/login.controller";
import passwordController from "./base/src/controller/auth/password.controller";
import { refreshTokenHandler } from "./base/src/controller/auth/refresh-token.controller";
import { signupHandler } from "./base/src/controller/auth/signup.controller";
import { meHandler } from "./base/src/controller/user/me.controller";
import connectDB from "./base/src/libs/mongo";
import jwtDecodeMiddleware from "./base/src/middleware/jwt-decode";
import { JsonTyped } from "./base/src/types/typed-response";
import {
  createClubHandler,
  getClubById,
  getClubListByUserEmail,
  patchByIdHandler,
  reactivateSubscriptionHandler,
} from "./src/controller/club.controller";
import { MemberController } from "./src/controller/member.controller";
import { NewsController } from "./src/controller/news.controller";
import {
  deleteReportByIdHandler,
  getReportByIdHandler,
  getReportsByClubIdHandler,
  patchReportByIdHandler,
  postReportHandler,
} from "./src/controller/report.controller";
import { TrainingController } from "./src/controller/training.controller";
import { updateMeHandler } from "./src/controller/user.controller";
import { checkSubscription } from "./src/middleware/check-subscription";

connectDB();

const app: Express = express();

console.log(process.env.ENV);

let origin: string[] = [
  "https://ttclubmanager.com",
  "https://api.ttclubmanager.com",
];

if (process.env.ENV === "development") {
  origin.push("http://localhost:3000");
}

const corsOptions = {
  origin: origin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Origin",
  ],
};

// Apply CORS middleware before other middlewares
app.use(cors(corsOptions));

app.response.jsonTyped = function (data: JsonTyped) {
  this.json(data);
};

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Auth
app.post("/login", loginHandler);
app.post("/signup", signupHandler);
app.post("/refresh-token", refreshTokenHandler);
app.post("/password/forgot", passwordController.forgotPassword);
app.get("/password/reset/:token", passwordController.tokenPassword);
app.post("/password/update", passwordController.updatePassword);
app.get("/user/me", jwtDecodeMiddleware, meHandler);
app.post("/user/logout", logoutHandler);
app.get("/reset-password.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/reset-password.html"));
});
app.patch("/user/me", jwtDecodeMiddleware, (req, res) => {
  updateMeHandler(req, res);
});

// Club
app.post("/club", jwtDecodeMiddleware, (req, res) => {
  createClubHandler(req, res);
});
app.get("/club", jwtDecodeMiddleware, (req, res) => {
  getClubListByUserEmail(req, res);
});
app.get("/club/:id_club", jwtDecodeMiddleware, (req, res) => {
  getClubById(req, res);
});
app.patch(
  "/club/:id_club",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    patchByIdHandler(req, res);
  }
);
app.post(
  "/club/:id_club/reactivate-subscription",
  jwtDecodeMiddleware,
  (req, res) => {
    reactivateSubscriptionHandler(req, res);
  }
);

// Report
app.get("/club/:id_club/report", jwtDecodeMiddleware, (req, res) => {
  getReportsByClubIdHandler(req, res);
});
app.post(
  "/club/:id_club/report",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    postReportHandler(req, res);
  }
);
app.get("/club/:id_club/report/:id_report", jwtDecodeMiddleware, (req, res) => {
  getReportByIdHandler(req, res);
});
app.patch(
  "/club/:id_club/report/:id_report",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    patchReportByIdHandler(req, res);
  }
);
app.delete(
  "/club/:id_club/report/:id_report",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    deleteReportByIdHandler(req, res);
  }
);

// Member
app.get("/club/:id_club/current-member", jwtDecodeMiddleware, (req, res) => {
  MemberController.getCurrentMember(req, res);
});
app.get("/club/:id_club/member", jwtDecodeMiddleware, (req, res) => {
  MemberController.getClubMembers(req, res);
});
app.post(
  "/club/:id_club/member",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    MemberController.post(req, res);
  }
);
app.patch(
  "/club/:id_club/member/:id_member",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    MemberController.patch(req, res);
  }
);
app.delete(
  "/club/:id_club/member/:id_member/role",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    MemberController.deleteRole(req, res);
  }
);
app.patch(
  "/club/:id_club/member/:id_member/role",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    MemberController.patchRole(req, res);
  }
);

// News routes
app.get("/club/:id_club/news", jwtDecodeMiddleware, (req, res) => {
  NewsController.getClubNews(req, res);
});
app.post(
  "/club/:id_club/news",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    NewsController.create(req, res);
  }
);
app.patch(
  "/club/:id_club/news/:id_news",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    NewsController.update(req, res);
  }
);
app.delete(
  "/club/:id_club/news/:id_news",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    NewsController.delete(req, res);
  }
);

// Training routes
app.post(
  "/club/:id_club/training",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    TrainingController.create(req, res);
  }
);
app.get("/club/:id_club/training", jwtDecodeMiddleware, (req, res) => {
  TrainingController.getClubTrainings(req, res);
});
app.get(
  "/club/:id_club/training/:id_training",
  jwtDecodeMiddleware,
  (req, res) => {
    TrainingController.getTrainingById(req, res);
  }
);
app.patch(
  "/club/:id_club/training/:id_training",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    TrainingController.update(req, res);
  }
);
app.delete(
  "/club/:id_club/training/:id_training",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    TrainingController.delete(req, res);
  }
);
app.post(
  "/club/:id_club/training/:id_training/member",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    TrainingController.addMember(req, res);
  }
);
app.delete(
  "/club/:id_club/training/:id_training/member",
  jwtDecodeMiddleware,
  checkSubscription,
  (req, res) => {
    TrainingController.removeMember(req, res);
  }
);

const host = "localhost";
const port = 8080;

const devServerHttps = process.env.DEV_SERVER_HTTPS === "true";

if (devServerHttps) {
  https
    .createServer(
      {
        key: fs.readFileSync("TeoBook.fritz.box-key.pem"),
        cert: fs.readFileSync("TeoBook.fritz.box.pem"),
      },
      app
    )
    .listen(port, host, () => {
      console.log(`[server]: Server is running at https://${host}:${port}`);
    });
} else {
  app.listen(port, host, () => {
    console.log(`[server]: Server is running at http://${host}:${port}`);
  });
}

*/

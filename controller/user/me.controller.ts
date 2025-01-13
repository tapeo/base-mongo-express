import { Request, Response } from "express";
import { extensionSendTelegramBotMessage } from "../../extensions/telegram.extension";
import { UserService } from "../../services/user.service";

export const meHandler = async (req: Request, res: Response) => {
  const idUser = req.headers.id_user as string;

  const user = await UserService.getById(idUser);

  return res.status(200).jsonTyped({
    status: "success",
    data: user,
  });
};

export const deleteMeHandler = async (req: Request, res: Response) => {
  const idUser = req.headers.id_user as string;

  try {
    const user = await UserService.getById(idUser);

    if (!user) {
      res.status(404).jsonTyped({
        status: "error",
        message: "User not found",
        data: null,
      });
    }

    await extensionSendTelegramBotMessage({
      content: `User account deletion request: ${idUser} ${user.email} on ${process.env.DOMAIN}`,
      parse_mode: "HTML",
    });

    res.status(200).jsonTyped({
      status: "success",
      message: "User account deletion requested",
      data: null,
    });
  } catch (error) {
    res.status(500).jsonTyped({
      status: "error",
      message: "Failed to delete user",
      data: null,
    });
  }
};

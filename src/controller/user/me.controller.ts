import { Request, Response } from "express";
import { UserService } from "../../services/user.service";

export const meHandler = async (req: Request, res: Response) => {
  const idUser = req.headers.id_user as string;

  try {
    const user = await UserService.getById(idUser);

    res.status(200).jsonTyped({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(500).jsonTyped({
      status: "error",
      message: "Failed to get user",
      data: null,
    });
  }
};

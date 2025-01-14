import { Request, Response } from "express";
import { UserService } from "../../services/user.service";

export const getUserHandler = async (req: Request, res: Response) => {
  const { type, search } = req.query;

  const streamers = await UserService.get({
    type: type as string,
    search: search as string,
  });

  return res.status(200).jsonTyped({
    status: "success",
    data: streamers,
  });
};

import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { extensionSendTelegramBotMessage } from "../../extensions/telegram.extension";
import { UserService } from "../../services/user.service";

export const signupHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (!isValidEmail(email)) {
    res.status(400).json({ message: "Invalid email" });
    return;
  }

  const passwordEncrypted = await bcrypt.hash(password, 10);

  try {
    const user = await UserService.post(email, passwordEncrypted);

    await extensionSendTelegramBotMessage({
      content: `New user registered: ${email}`,
    });

    res.json({
      message: "Registration successful, now you can login",
      user: {
        id: user.id,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

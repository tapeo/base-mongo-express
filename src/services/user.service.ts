import { User } from "../model/user.model";

export class UserService {
  static getById = async (id: string) => {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  };

  static getUserByEmail = async (email: string) => {
    const user = await User.findOne({ email: email });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  };

  static post = async (email: string, passwordEncrypted: string) => {
    const user = await User.create({
      email,
      password: passwordEncrypted,
    });

    return user;
  };

  static patch = async (idUser: string, data: any) => {
    const user = await User.findByIdAndUpdate(idUser, data, { new: true });

    return user;
  };

  static verifyEmail = async (idUser: string) => {
    const user = await User.findByIdAndUpdate(idUser, {
      email_verified: true,
    });

    return user;
  };
}

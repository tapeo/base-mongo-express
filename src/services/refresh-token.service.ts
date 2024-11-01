import { User } from "../model/user.model";

export class RefreshTokenService {
  private static expireAfter: number = 30 * 24 * 60 * 60 * 1000;

  static post = async (userId: string, refreshToken: string) => {
    const data = {
      id_user: userId,
      expires_at: new Date(Date.now() + this.expireAfter),
      encrypted_jwt: refreshToken,
    };

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { refresh_tokens: data } },
      { new: true, useFindAndModify: false }
    );

    if (!user) {
      throw new Error("User not found");
    }

    // delete all expired tokens
    const indexListDelete: number[] = [];

    for (let i = 0; i < user.refresh_tokens.length; i++) {
      if (user.refresh_tokens[i].expires_at < new Date()) {
        indexListDelete.push(i);
      }
    }

    for (let i = indexListDelete.length - 1; i >= 0; i--) {
      user.refresh_tokens.splice(indexListDelete[i], 1);
    }

    await user.save();

    return user?.refresh_tokens[user.refresh_tokens.length - 1];
  };

  static getByUserId = async (userId: string) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user.refresh_tokens;
  };

  static delete = async (userId: string, encryptedRefreshToken: string) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { refresh_tokens: { encrypted_jwt: encryptedRefreshToken } } },
      { new: true, useFindAndModify: false }
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  };
}

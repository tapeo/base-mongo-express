import { User } from "../model/user.model";

export class RefreshTokenService {
  private static expireAfter: number = 30 * 24 * 60 * 60 * 1000;

  static post = async (userId: string, refreshToken: string) => {
    const data = {
      id_user: userId,
      expires_at: new Date(Date.now() + this.expireAfter),
      encrypted_jwt: refreshToken,
    };

    await User.findByIdAndUpdate(
      userId,
      { $push: { refresh_tokens: data } },
      { new: true, useFindAndModify: false }
    );

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const validTokens = user.refresh_tokens.filter(
      (token) => token.expires_at >= new Date()
    );

    if (validTokens.length < user.refresh_tokens.length) {
      await User.findByIdAndUpdate(
        userId,
        { $set: { refresh_tokens: validTokens } },
        { new: true, useFindAndModify: false }
      );
    }

    return validTokens[validTokens.length - 1];
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

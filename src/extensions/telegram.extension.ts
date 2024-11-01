import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token!, { polling: false });

export type SendBotMessageProps = {
  content: string;
  parse_mode?: "Markdown" | "HTML";
};

export const extensionSendTelegramBotMessage = async ({
  content,
  parse_mode,
}: SendBotMessageProps) => {
  await bot.sendMessage(process.env.TELEGRAM_CHAT_ID!, content, {
    parse_mode: parse_mode ?? "Markdown",
  });
};

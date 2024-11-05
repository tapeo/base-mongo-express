export type SendBotMessageProps = {
  content: string;
  parse_mode?: "Markdown" | "HTML";
};

export const extensionSendTelegramBotMessage = async ({
  content,
  parse_mode,
}: SendBotMessageProps) => {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: content,
        parse_mode: parse_mode ?? "Markdown",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to send message to Telegram");
  }
};

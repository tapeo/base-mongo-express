interface SendPushNotificationParams {
  contents: {
    en: string;
    it?: string;
  };
  includedSegments?: string[];
  excludedSegments?: string[];
  includeSubscriptionIds?: string[];
}

export const sendPushNotification = async ({
  contents,
  includedSegments = [],
  excludedSegments = [],
  includeSubscriptionIds = [],
}: SendPushNotificationParams) => {
  try {
    return await send({
      contents,
      includedSegments,
      excludedSegments,
      includeSubscriptionIds,
    });
  } catch (error) {
    console.error(
      "OneSignal Push Notification Error:",
      error,
      "try to create segment and retry"
    );

    if (includedSegments.length > 0) {
      try {
        await createSegment({ name: includedSegments[0] });
        return await send({
          contents,
          includedSegments,
          excludedSegments,
          includeSubscriptionIds,
        });
      } catch (error) {
        console.error("OneSignal Create Segment Error:", error);
        throw error;
      }
    }

    throw error;
  }
};

const send = async ({
  contents,
  includedSegments,
  excludedSegments,
  includeSubscriptionIds,
}: {
  contents: SendPushNotificationParams["contents"];
  includedSegments: string[];
  excludedSegments: string[];
  includeSubscriptionIds: string[];
}) => {
  const options = {
    method: "POST",
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      app_id: process.env.ONESIGNAL_APP_ID,
      contents,
      included_segments:
        includedSegments?.length > 0 ? includedSegments : undefined,
      excluded_segments:
        excludedSegments?.length > 0 ? excludedSegments : undefined,
      include_subscription_ids:
        includeSubscriptionIds?.length > 0 ? includeSubscriptionIds : undefined,
      target_channel: "push",
    }),
  };

  console.log("sending push notification", options);

  const response = await fetch(
    "https://api.onesignal.com/notifications",
    options
  );
  const data = await response.json();

  console.log("push notification sent", data);

  if (!response.ok) {
    throw new Error(data.errors?.[0] || "Failed to send push notification");
  }

  return data;
};

interface CreateSegmentParams {
  name: string;
}

const createSegment = async ({ name }: CreateSegmentParams) => {
  try {
    const options = {
      method: "POST",
      headers: {
        Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ name }),
    };

    const response = await fetch(
      `https://api.onesignal.com/apps/${process.env.ONESIGNAL_APP_ID}/segments`,
      options
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0] || "Failed to create segment");
    }

    return data;
  } catch (error) {
    console.error("OneSignal Create Segment Error:", error);
    throw error;
  }
};

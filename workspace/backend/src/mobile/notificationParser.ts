export type MobileNotification = {
  packageName: string;
  title?: string;
  text?: string;
  postedAt?: number;
  category?: string;
  isOngoing?: boolean;
};

export type NotificationSnapshot = {
  notifications: MobileNotification[];
};

export function parseNotificationSnapshot(raw: any): NotificationSnapshot {
  const parsed: NotificationSnapshot = { notifications: [] };
  
  if (!raw || !Array.isArray(raw.notifications)) {
    return parsed;
  }

  for (const item of raw.notifications) {
    parsed.notifications.push(normalizeNotification(item));
  }
  
  return parsed;
}

export function normalizeNotification(rawItem: any): MobileNotification {
  return {
    packageName: typeof rawItem.packageName === "string" ? rawItem.packageName : "unknown",
    title: typeof rawItem.title === "string" ? rawItem.title : undefined,
    text: typeof rawItem.text === "string" ? rawItem.text : undefined,
    postedAt: typeof rawItem.postedAt === "number" ? rawItem.postedAt : undefined,
    category: typeof rawItem.category === "string" ? rawItem.category : undefined,
    isOngoing: typeof rawItem.isOngoing === "boolean" ? rawItem.isOngoing : false,
  };
}

import { MobileNotification } from "./notificationParser";

export type InterpretedNotification = {
  type: "message" | "call" | "system" | "reminder" | "file_event" | "unknown";
  priority: "critical" | "high" | "normal" | "low";
  packageName: string;
  title?: string;
  text?: string;
  original: MobileNotification;
};

export function interpretNotification(notif: MobileNotification): InterpretedNotification {
  let type: InterpretedNotification["type"] = "unknown";
  let priority: InterpretedNotification["priority"] = "low";

  const pkg = notif.packageName.toLowerCase();
  const text = (notif.text || "").toLowerCase();
  const title = (notif.title || "").toLowerCase();

  // 1. Classify type
  if (
    pkg.includes("telegram") ||
    pkg.includes("whatsapp") ||
    pkg.includes("messaging") ||
    pkg.includes("mms") ||
    pkg.includes("sms") ||
    notif.category === "msg"
  ) {
    type = "message";
  } else if (
    pkg.includes("dialer") ||
    pkg.includes("phone") ||
    pkg.includes("call") ||
    notif.category === "call"
  ) {
    type = "call";
  } else if (
    pkg.includes("calendar") ||
    notif.category === "reminder" ||
    notif.category === "event"
  ) {
    type = "reminder";
  } else if (
    pkg.includes("android.systemui") ||
    pkg.includes("settings") ||
    notif.category === "sys"
  ) {
    type = "system";
  } else if (
    pkg.includes("download") ||
    pkg.includes("vending")
  ) {
    type = "file_event";
  }

  // 2. Assign priority
  if (type === "call") {
    priority = notif.isOngoing ? "critical" : "high";
  } else if (type === "system") {
    if (text.includes("low battery") || title.includes("warning") || title.includes("alert")) {
      priority = "critical";
    } else {
      priority = "normal";
    }
  } else if (type === "message") {
    priority = "high"; // Unread messages are generally high priority
  } else if (type === "reminder") {
    priority = "normal";
  } else {
    priority = "low";
  }

  return {
    type,
    priority,
    packageName: notif.packageName,
    title: notif.title,
    text: notif.text,
    original: notif
  };
}

export function interpretSnapshot(notifications: MobileNotification[]): InterpretedNotification[] {
  return notifications.map(interpretNotification);
}

import { InterpretedNotification } from "./notificationInterpreter";
import { evaluateActionSafety } from "../security/notificationSafety";

export type NotificationActionPlan =
  | { action: "summarize"; items: string[] }
  | { action: "suggest_open_app"; packageName: string; reason?: string }
  | { action: "request_confirmation"; reason: string }
  | { action: "ignore"; reason: string };

export function planForNotification(notif: InterpretedNotification): NotificationActionPlan {
  // Check policy first
  if (!evaluateActionSafety("interpret", notif.packageName)) {
    return { action: "ignore", reason: `Safety policy blocked interpretation for ${notif.packageName}` };
  }

  if (notif.type === "message") {
    return {
      action: "suggest_open_app",
      packageName: notif.packageName,
      reason: `You have a new message from ${notif.title || "someone"}. Would you like me to open the app?`
    };
  }

  if (notif.type === "call") {
    return {
      action: "request_confirmation",
      reason: `Missed or active call detected from ${notif.title || "unknown"}. Should I open the dialer or call back?`
    };
  }

  if (notif.type === "system") {
    if (notif.priority === "critical") {
      return {
        action: "summarize",
        items: [`CRITICAL SYSTEM ALERT: ${notif.title} - ${notif.text}`]
      };
    } else {
      return {
        action: "summarize",
        items: [`System notification: ${notif.title}`]
      };
    }
  }

  if (notif.type === "unknown") {
    if (notif.priority === "low") {
      return { action: "ignore", reason: "Low priority unknown notification." };
    }
  }

  // Default fallback
  return {
    action: "summarize",
    items: [`${notif.title || notif.packageName}: ${notif.text || "No details"}`]
  };
}

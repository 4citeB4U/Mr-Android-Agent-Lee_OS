import { debugStore } from "../utils/debugStore.js";

export type PhoneAction =
  | "go_home"
  | "read_screen"
  | "capture_screen"
  | "ui_dump"
  | "list_apps"
  | "list_files"
  | "launch_approved_app"
  | "send_message"
  | "start_call"
  | "take_photo"
  | "record_video"
  | "delete_file"
  | "change_settings";

const autoAllow = new Set<PhoneAction>([
  "go_home",
  "read_screen",
  "capture_screen",
  "ui_dump",
  "list_apps",
  "list_files",
  "launch_approved_app"
]);

const requireConfirmation = new Set<PhoneAction>([
  "send_message",
  "start_call",
  "take_photo",
  "record_video",
  "delete_file",
  "change_settings"
]);

export function getPhoneActionPolicy(action: PhoneAction): "allow" | "confirm" | "deny" {
  let policy: "allow" | "confirm" | "deny" = "deny";
  if (autoAllow.has(action)) policy = "allow";
  else if (requireConfirmation.has(action)) policy = "confirm";
  
  debugStore.updateSafetyPolicy(action, policy);
  return policy;
}

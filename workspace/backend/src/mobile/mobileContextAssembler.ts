import { SensorEnvironment } from "./sensorModel.js";
import { ScreenElement } from "../vision/phoneScreenModel.js";

export type MobileContext = {
  visibleApp?: string;
  visibleTexts: string[];
  clickableCount: number;
  environment: SensorEnvironment;
};

export function assembleMobileContext(
  screenModel: ScreenElement[],
  sensorEnvironment: SensorEnvironment
): MobileContext {
  
  // Deduce the primary visible app from generic package or known text cues if available
  // E.g., looking at common resource-ids like "org.telegram.messenger:id/..."
  const telegramNodes = screenModel.filter(e => e.resourceId?.includes("telegram"));
  let visibleApp = "home";
  
  if (telegramNodes.length > 0 && !screenModel.some(e => e.text?.toLowerCase() === "telegram" && e.clickable && telegramNodes.length === 1)) { 
      // Safe heuristic: If there are telegram resource IDs, and it's not JUST the homescreen icon
      visibleApp = "telegram";
  } else if (screenModel.some(e => e.text?.toLowerCase() === "telegram" && e.clickable)) {
      visibleApp = "home"; // Just the icon is visible
  }

  const visibleTexts = screenModel
    .filter(e => e.text && e.text.trim().length > 0)
    .map(e => e.text as string);

  const clickableCount = screenModel.filter(e => e.clickable).length;

  return {
    visibleApp,
    visibleTexts,
    clickableCount,
    environment: sensorEnvironment
  };
}

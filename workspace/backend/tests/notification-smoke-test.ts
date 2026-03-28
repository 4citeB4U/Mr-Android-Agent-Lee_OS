import { parseNotificationSnapshot, MobileNotification } from "../src/mobile/notificationParser";
import { interpretNotification, InterpretedNotification } from "../src/mobile/notificationInterpreter";
import { planForNotification } from "../src/mobile/notificationPlanner";
import { isActionAllowed } from "../src/security/notificationSafety";

const MOCK_SNAPSHOT = {
    notifications: [
        {
            packageName: "org.telegram.messenger",
            title: "John",
            text: "Are you on the way?",
            category: "msg",
            isOngoing: false,
            postedAt: 1773642000000
        },
        {
            packageName: "com.android.dialer",
            title: "Missed Call",
            text: "Alice",
            category: "call",
            isOngoing: false,
            postedAt: 1773642000000
        },
        {
            packageName: "com.android.systemui",
            title: "Low Battery",
            text: "15% remaining",
            category: "sys",
            isOngoing: true,
            postedAt: 1773642000000
        },
        {
            packageName: "com.google.android.apps.authenticator2",
            title: "2FA Code",
            text: "Your code is 123456",
            category: "msg",
            isOngoing: false,
            postedAt: 1773642000000
        }
    ]
};

async function runTests() {
    console.log("==========================================");
    console.log("   Notification Logic Smoke Test");
    console.log("==========================================\n");

    const parsed = parseNotificationSnapshot(MOCK_SNAPSHOT);
    
    // 1. Telegram Message
    const tMsg = interpretNotification(parsed.notifications[0]);
    console.log(`[Test 1] Telegram Message:`);
    console.log(`  Expected: type='message', priority='high'`);
    console.log(`  Actual  : type='${tMsg.type}', priority='${tMsg.priority}'`);
    const tPlan = planForNotification(tMsg);
    console.log(`  Action  : ${tPlan.action} (Reason: ${(tPlan as any).reason})`);
    if (tMsg.type !== "message" || tMsg.priority !== "high" || tPlan.action !== "suggest_open_app") {
        console.error("  -> FAILED\n");
        process.exit(1);
    } else {
        console.log("  -> PASS\n");
    }

    // 2. Missed Call
    const callMsg = interpretNotification(parsed.notifications[1]);
    console.log(`[Test 2] Missed Call:`);
    console.log(`  Expected: type='call', priority='high'`);
    console.log(`  Actual  : type='${callMsg.type}', priority='${callMsg.priority}'`);
    const callPlan = planForNotification(callMsg);
    console.log(`  Action  : ${callPlan.action} (Reason: ${(callPlan as any).reason})`);
    if (callMsg.type !== "call" || callPlan.action !== "request_confirmation") {
        console.error("  -> FAILED\n");
        process.exit(1);
    } else {
        console.log("  -> PASS\n");
    }

    // 3. Battery Warning
    const battMsg = interpretNotification(parsed.notifications[2]);
    console.log(`[Test 3] Battery Warning:`);
    console.log(`  Expected: type='system', priority='critical'`);
    console.log(`  Actual  : type='${battMsg.type}', priority='${battMsg.priority}'`);
    const battPlan = planForNotification(battMsg);
    console.log(`  Action  : ${battPlan.action} (Items: ${(battPlan as any).items?.join(", ")})`);
    if (battMsg.type !== "system" || battMsg.priority !== "critical" || battPlan.action !== "summarize") {
        console.error("  -> FAILED\n");
        process.exit(1);
    } else {
        console.log("  -> PASS\n");
    }

    // 4. Authenticator Warning (Blocked)
    const authMsg = interpretNotification(parsed.notifications[3]);
    console.log(`[Test 4] Authenticator (Safety Block):`);
    const authPlan = planForNotification(authMsg);
    console.log(`  Action  : ${authPlan.action} (Reason: ${(authPlan as any).reason})`);
    if (authPlan.action !== "ignore") {
        console.error("  -> FAILED (Safety policy did not block interpretation)\n");
        process.exit(1);
    } else {
        console.log("  -> PASS\n");
    }

    console.log("All notification tests passed successfully.");
}

runTests().catch(console.error);

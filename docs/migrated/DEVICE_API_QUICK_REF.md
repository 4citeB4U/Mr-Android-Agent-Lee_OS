# Device API Quick Reference

## DeviceTelemetry - Monitor Device Resources

### Import
```typescript
import { DeviceTelemetry } from '@/core/DeviceTelemetry';
const deviceTelemetry = DeviceTelemetry.getInstance();
```

### Get Current Device Status
```typescript
const status = deviceTelemetry.getDeviceStatus();

// Access any metric:
status.battery.level           // 0-100
status.battery.isCharging      // true/false
status.battery.minutes         // time estimate
status.network.type            // 'wifi' | '4g' | '5g' | 'none'
status.network.effectiveType   // '4g' | '3g' | '2g' | 'slow-2g'
status.network.downlink        // Mbps estimate
status.storage.used            // bytes
status.storage.quota           // bytes
status.storage.percent         // 0-100
status.memory.heapSizeMB       // JavaScript heap
status.screen.width            // pixels
status.screen.height           // pixels
status.screen.orientation      // 'portrait' | 'landscape'
status.platform.os             // 'ios' | 'android' | 'linux' | 'mac' | 'win'
status.permissions             // { microphone: 'prompt', camera: 'denied', ... }
```

### Subscribe to Changes
```typescript
// Re-render when battery changes
const unsub = deviceTelemetry.subscribe('battery', (status) => {
  console.log(`Battery: ${status.battery.level}%`);
});

// Cleanup on unmount
useEffect(() => {
  return unsub;
}, []);
```

### Check Permissions
```typescript
const perms = await deviceTelemetry.checkPermissions();

if (perms.camera === 'granted') {
  // Safe to use camera
}

if (perms.camera === 'denied') {
  // User rejected; show fallback
}

if (perms.camera === 'prompt') {
  // Not asked yet; request
  await deviceTelemetry.requestPermission('camera');
}
```

### Detect Low-End Devices
```typescript
if (deviceTelemetry.isLowEndDevice()) {
  // Disable heavy animations, reduce effects
}

if (deviceTelemetry.isExpensiveConnection()) {
  // Reduce video quality, disable autoplay
}
```

---

## NativeBridge - Access Native APIs

### Import
```typescript
import { NativeBridge } from '@/core/NativeBridge';
const nativeBridge = NativeBridge.getInstance();
```

### Detect Platform
```typescript
const platform = nativeBridge.getPlatform();
// Returns: 'ios' | 'android' | 'web' | 'electron'

if (nativeBridge.isNative()) {
  // Running as native app (iOS/Android)
  // Use full Capacitor APIs
} else {
  // Running on web
  // Use fallbacks automatically
}
```

### Camera - Take Photo
```typescript
try {
  const photo = await nativeBridge.takePhoto();
  
  console.log(photo.webPath);  // File path (works on all platforms)
  console.log(photo.path);     // Native path (iOS/Android only)
  console.log(photo.exif);     // EXIF data if available
  
  // Use in <img>
  <img src={photo.webPath} />
} catch (error) {
  console.error('Camera error:', error);
}
```

### Contacts - List All Contacts
```typescript
try {
  const contacts = await nativeBridge.getContacts();
  
  contacts.forEach(contact => {
    console.log(contact.name);     // "John Doe"
    console.log(contact.email);    // "john@example.com"
    console.log(contact.phone);    // "+1234567890"
    console.log(contact.address);  // "123 Main St"
  });
} catch (error) {
  console.error('Contacts error:', error);
  // Fallback: upload CSV, parse locally
}
```

### Email - Send Email
```typescript
await nativeBridge.sendEmail({
  to: ['user@example.com'],
  cc: ['manager@example.com'],
  bcc: [],
  subject: 'Hello from Agent Lee',
  body: 'This is the message body',
  attachments: ['/path/to/file.pdf'], // iOS/Android only
});

// On web: Opens mailto:// with best effort
// On iOS: Delegates to Mail.app
// On Android: Delegates to Gmail/default email app
```

### SMS - Send Text Message
```typescript
await nativeBridge.sendSMS(
  '+1234567890',
  'Hello! This is a text from Agent Lee'
);

// On web: Opens sms:// scheme
// On iOS/Android: Delegates to Messages/SMS app
```

### Calendar - Create Event
```typescript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

await nativeBridge.createCalendarEvent(
  'Agent Lee Meeting',
  'Discuss agentic AI systems',
  tomorrow
);

// On web: Fallback (opens browser calendar, requires manual entry)
// On iOS: Creates in Calendar app
// On Android: Creates in Calendar app
```

### Calendar - Open App
```typescript
await nativeBridge.openCalendar();

// On web: Opens calendar.leeway.com or system calendar
// On iOS: Opens Apple Calendar app
// On Android: Opens leeway Calendar / system calendar
```

### Notifications - Push Local Notification
```typescript
await nativeBridge.sendNotification({
  title: 'Agent Lee Update',
  body: 'Your analysis is ready',
  id: 1,
  actionType: 'tap',
});

// On web: Uses Notification API (if permission granted)
// On iOS/Android: Native notification in status bar
```

### Device ID - Get Unique Identifier
```typescript
const deviceId = await nativeBridge.getDeviceId();
console.log(deviceId); // Unique per install

// Use for:
// - Analytics tracking
// - Device enrollment
// - License binding
// - Crash reporting
```

### App Review - Trigger Store Review
```typescript
await nativeBridge.requestAppReview();

// On iOS: Opens App Store review dialog
// On Android: Opens leeway Play review dialog
// On web: Does nothing
```

---

## Error Handling

### Listen to Native Events
```typescript
import { eventBus } from '@/core/EventBus';

// Device permission errors
eventBus.on('device:permission-error', ({ permission, error }) => {
  console.error(`Permission ${permission} error:`, error);
});

// Device telemetry changes
eventBus.on('device:telemetry-changed', ({ metric, status }) => {
  console.log(`Device metric changed: ${metric}`);
});

// Native API errors
eventBus.on('native:camera-error', ({ error }) => {
  console.error('Camera failed:', error);
  // Show fallback UI
});

eventBus.on('native:contacts-error', ({ error }) => {
  console.error('Contacts failed:', error);
  // Show file upload instead
});

eventBus.on('native:email-error', ({ error }) => {
  console.error('Email failed:', error);
  // Open mailto:// as fallback
});
```

### Try-Catch Pattern
```typescript
async function handlePhoto() {
  try {
    const photo = await nativeBridge.takePhoto();
    setPhotoUrl(photo.webPath);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Photo error:', error.message);
      // Show user-friendly message
      toast.error('Could not take photo. Please try again.');
    }
  }
}
```

---

## React Component Examples

### Device Status Display
```tsx
import { useEffect, useState } from 'react';
import { DeviceTelemetry } from '@/core/DeviceTelemetry';

export function DeviceStatus() {
  const deviceTelemetry = DeviceTelemetry.getInstance();
  const [battery, setBattery] = useState(100);
  const [network, setNetwork] = useState('unknown');

  useEffect(() => {
    // Subscribe to battery changes
    const unsub = deviceTelemetry.subscribe('battery', (status) => {
      setBattery(status.battery.level);
    });

    deviceTelemetry.subscribe('network', (status) => {
      setNetwork(status.network.type);
    });

    return unsub;
  }, []);

  return (
    <div>
      <p>Battery: {battery}%</p>
      <p>Network: {network}</p>
    </div>
  );
}
```

### Camera Capture
```tsx
import { useState } from 'react';
import { NativeBridge } from '@/core/NativeBridge';

export function CameraCapture() {
  const nativeBridge = NativeBridge.getInstance();
  const [photoUrl, setPhotoUrl] = useState<string>('');

  async function handleCapture() {
    try {
      const photo = await nativeBridge.takePhoto();
      setPhotoUrl(photo.webPath);
    } catch (error) {
      console.error('Failed to capture photo:', error);
    }
  }

  return (
    <div>
      <button onClick={handleCapture}>Take Photo</button>
      {photoUrl && <img src={photoUrl} alt="Captured" />}
    </div>
  );
}
```

### Contact Picker
```tsx
import { useState } from 'react';
import { NativeBridge } from '@/core/NativeBridge';

export function ContactPicker() {
  const nativeBridge = NativeBridge.getInstance();
  const [contacts, setContacts] = useState<any[]>([]);

  async function loadContacts() {
    try {
      const list = await nativeBridge.getContacts();
      setContacts(list);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  }

  return (
    <div>
      <button onClick={loadContacts}>Load Contacts</button>
      <ul>
        {contacts.map((c) => (
          <li key={c.email || c.phone}>
            {c.name} ({c.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Best Practices

1. **Always Check Platform First**
   ```typescript
   if (nativeBridge.isNative()) {
     // Use native API
   } else {
     // Use fallback
   }
   ```

2. **Request Permissions Explicitly**
   ```typescript
   const perms = await deviceTelemetry.checkPermissions();
   if (perms.camera !== 'granted') {
     await deviceTelemetry.requestPermission('camera');
   }
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     await nativeBridge.takePhoto();
   } catch (error) {
     // Show fallback UI or inform user
   }
   ```

4. **Unsubscribe from Telemetry**
   ```typescript
   const unsub = deviceTelemetry.subscribe('battery', ...);
   useEffect(() => {
     return unsub; // Cleanup on unmount
   }, []);
   ```

5. **Minimize Network Usage on Cellular**
   ```typescript
   if (deviceTelemetry.isExpensiveConnection()) {
     // Use lower quality images, disable autoplay
   }
   ```

6. **Optimize for Low-End Devices**
   ```typescript
   if (deviceTelemetry.isLowEndDevice()) {
     // Disable heavy animations, reduce effects
   }
   ```

---

**Last Updated:** April 6, 2026


/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

// Workbox precaching - injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Push notification received
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: { title?: string; body?: string; url?: string; icon?: string };
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Nova notificação", body: event.data.text() };
  }

  const options: NotificationOptions = {
    body: payload.body || "",
    icon: payload.icon || "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: { url: payload.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(payload.title || "Agile Lite", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

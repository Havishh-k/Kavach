import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: any;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ====== Custom Push Notification Logic ======
self.addEventListener('push', function (event: any) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2'
            }
        };
        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

self.addEventListener('notificationclick', function (event: any) {
    console.log('On notification click: ', event.notification.tag);
    event.notification.close();
    // Focuses the window if open, otherwise opens the root guard dashboard
    event.waitUntil(((self as any).clients as any).matchAll({
        type: "window"
    }).then(function (clientList: any[]) {
        for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url.includes('/guard') && 'focus' in client)
                return client.focus();
        }
        if (((self as any).clients as any).openWindow)
            return ((self as any).clients as any).openWindow('/guard');
    }));
});

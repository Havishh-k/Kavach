import type { Metadata, Viewport } from "next";
import { SyncProvider } from "@/components/guard/sync-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export const metadata: Metadata = {
  title: "Kavach Guard App",
  description: "Kavach Securities Guard Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kavach Guard",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function GuardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SyncProvider>
      {children}
      <PWAInstallPrompt />
    </SyncProvider>
  );
}

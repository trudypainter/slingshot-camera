import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slingshot Camera",
  description: "Drag to capture",
  viewport:
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="overflow-hidden fixed w-full h-full">{children}</body>
    </html>
  );
}

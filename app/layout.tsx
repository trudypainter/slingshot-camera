import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slingshot Camera",
  description: "Drag to capture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

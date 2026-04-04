import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EdPsych AI | Educational Psychology Platform",
  description: "AI-powered educational psychology assessment and report generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body>
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}

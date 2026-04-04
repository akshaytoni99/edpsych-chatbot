import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The EdPsych | Educational Psychology Platform",
  description: "Educational psychology assessment and report generation",
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

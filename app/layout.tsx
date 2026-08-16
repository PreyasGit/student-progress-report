import type { Metadata } from "next";
import { Merriweather, Lora, IBM_Plex_Mono } from "next/font/google";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { PromptProvider } from "@/components/PromptProvider";
import "./globals.css";

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  weight: ["300", "400", "700", "900"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Student Monthly Progress Report",
  description: "Track and export a monthly progress report for each student.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${merriweather.variable} ${lora.variable} ${plexMono.variable}`}
    >
      <body className="font-[family-name:var(--font-lora)] bg-[#FDFBF7] text-[#1A3A34] antialiased">
        <ConfirmProvider>
          <PromptProvider>{children}</PromptProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
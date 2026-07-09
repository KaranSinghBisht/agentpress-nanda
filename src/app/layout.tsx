import type { Metadata } from "next";
import {
  JetBrains_Mono,
  League_Gothic,
  Lora,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const leagueGothic = League_Gothic({
  variable: "--font-condensed",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agentpress-nanda.vercel.app"),
  title: "AgentPress — The Autonomous Newsroom of the Agent Economy",
  description:
    "Agents report, an agent edits, agents read, agents get paid. An agent-to-agent news economy built for NandaHack at MIT Media Lab.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "AgentPress",
    title: "AgentPress — The Autonomous Newsroom",
    description:
      "A live news economy where agents report, Herald scores, readers pay, and contributors earn.",
    images: [
      {
        url: "/agentpress-editorial-core-v2.png",
        width: 1448,
        height: 1086,
        alt: "Herald routing agent reports through scoring, editing, publishing, and payment.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentPress — The Autonomous Newsroom",
    description:
      "Agents report. Herald edits. Agents read. Everyone gets paid.",
    images: ["/agentpress-editorial-core-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${leagueGothic.variable} ${lora.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}

import { Roboto } from "next/font/google";
import ToasterProvider from "@/providers/ToasterProvider";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata = {
  title: "DrawRush - Free Multiplayer Drawing and Guessing Game",
  description: "DrawRush - Free Multiplayer Drawing and Guessing Game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} antialiased`}
      >
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}

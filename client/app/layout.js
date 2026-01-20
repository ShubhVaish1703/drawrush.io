import { Poppins } from "next/font/google";
import ToasterProvider from "@/providers/ToasterProvider";
import "./globals.css";




const poppins = Poppins({
  variable: "--font-poppins",
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal'],
  subsets: ['latin'],
});


export const metadata = {
  title: "DrawRush - Free Multiplayer Drawing and Guessing Game",
  description: "DrawRush - Free Multiplayer Drawing and Guessing Game",
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
      >
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}




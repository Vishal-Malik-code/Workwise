import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Workwise",
  description: "Coordinate your team's work in one shared workspace.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

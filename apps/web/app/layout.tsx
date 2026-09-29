import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aido — NGX Investment Intelligence",
  description: "Don't just know what the market is doing. Know what it means for you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("aido-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body>
        {children}
        <footer style={{ maxWidth: 960, margin: "32px auto 0", padding: "16px", fontSize: 12, color: "var(--muted)", borderTop: "1px solid var(--border)" }}>
          Aido is educational investment intelligence, not financial advice. <a href="/methodology">How Aido thinks →</a>
        </footer>
      </body>
    </html>
  );
}

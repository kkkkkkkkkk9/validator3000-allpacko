import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Validator 3000",
  description: "Multi-product wireframing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg-primary text-primary font-mono antialiased">
        {children}
      </body>
    </html>
  );
}

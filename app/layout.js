import "./globals.css";

export const metadata = {
  title: "ShopeeContent Generator",
  description: "Generator konten Threads untuk kreator affiliate Shopee"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

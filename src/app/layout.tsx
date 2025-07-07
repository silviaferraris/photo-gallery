import './globals.css'
export const metadata = {
  title: 'Galleria',
  description: 'Foto ricordo con tag',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
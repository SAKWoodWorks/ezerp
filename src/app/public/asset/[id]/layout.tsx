// This layout ensures that public-facing asset pages do not have the main sidebar.
export default function PublicAssetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <main>{children}</main>
}

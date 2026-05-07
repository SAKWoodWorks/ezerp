/* eslint-disable @typescript-eslint/no-require-imports */
import type { NextConfig } from "next"
//import createNextIntlPlugin from "next-intl/plugin"
const createNextIntlPlugin = require("next-intl/plugin")

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  outputFileTracingRoot: __dirname,
  images: {
    // เพิ่มส่วนนี้เพื่ออนุญาต Hostname ของ Supabase Storage
    remotePatterns: [
      {
        protocol: "https",
        // ใส่ Hostname ที่ได้จากข้อความ Error ที่นี่
        hostname: "bzwysgttfziejgznhhep.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}
const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)

//export default nextConfig

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// `npm run dev` is plain http. `npm run dev:https` serves https with a self-signed certificate,
// which phones need before the browser allows the live camera on a Wi-Fi address.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'https' ? [basicSsl()] : [])],
}))

// Default to same-origin so Vite dev proxy can forward to the backend.
// Override in production via VITE_API_BASE_URL (e.g. https://api.yourdomain.com)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default BASE_URL;
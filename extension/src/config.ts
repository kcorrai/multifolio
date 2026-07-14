// Build-time sabitler. __API_BASE__ esbuild --define ile gömülür:
// build:dev → http://localhost:3000, build → https://multifolio-ecru.vercel.app
declare const __API_BASE__: string;

export const API_BASE = __API_BASE__;
export const IMPORT_ENDPOINT = `${API_BASE}/api/profile/import`;
export const JOBS_ENDPOINT = `${API_BASE}/api/jobs`;
export const PROPOSAL_ENDPOINT = `${API_BASE}/api/proposal`;
export const PROPOSAL_LATEST_ENDPOINT = `${API_BASE}/api/proposal/latest`;
export const QUICK_MATCH_ENDPOINT = `${API_BASE}/api/match/quick`;
export const WIZARD_URL = `${API_BASE}/dashboard/import?source=extension`;
export const LOGIN_URL = `${API_BASE}/login`;

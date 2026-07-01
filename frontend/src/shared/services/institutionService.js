import api from './api';

// Public endpoint — no auth required. Used to brand pages (login, sidebars) with
// the institution's logo/name.
export async function getInstitutionProfile() {
  const res = await api.get('/institution-profile');
  return res.data?.data ?? res.data;
}

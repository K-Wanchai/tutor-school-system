import { useEffect, useState } from 'react';
import { getInstitutionProfile } from '../services/institutionService';

// Fetches the institution profile (logo, name, contact info) for branding
// public/shared UI — login page, sidebars. Returns null until loaded or on error.
export default function useInstitutionProfile() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    getInstitutionProfile()
      .then((data) => { if (active) setProfile(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return profile;
}

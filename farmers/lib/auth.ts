export function getSession() {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('farmer_session');
  return session ? JSON.parse(session) : null;
}

export function setSession(data: any) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('farmer_session', JSON.stringify(data));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('farmer_session');
}
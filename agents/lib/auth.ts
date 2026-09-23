export function login(email: string, password: string) {
  if (email === 'agent.v2@mandi' && password === 'Agent@V2') {
    const user = { name: 'Agent V2', role: 'AGENT' };
    localStorage.setItem('session', JSON.stringify(user));
    return true;
  }
  return false;
}

export function getSession() {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
  }
  return null;
}

export function logout() {
  localStorage.removeItem('session');
}

export const MOCK_USER = {
  email: 'mandi.officer.v2@mandi',
  password: 'Mandi@V2',
  sessionData: {
    name: 'Mandi Officer V2',
    role: 'APMC'
  }
};

export function login(email, password) {
  if (email === MOCK_USER.email && password === MOCK_USER.password) {
    localStorage.setItem('mandi_session', JSON.stringify(MOCK_USER.sessionData));
    return true;
  }
  return false;
}

export function logout() {
  localStorage.removeItem('mandi_session');
}

export function getSession() {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('mandi_session');
    return session ? JSON.parse(session) : null;
  }
  return null;
}

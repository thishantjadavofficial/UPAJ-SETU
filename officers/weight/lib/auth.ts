export const AUTH_CREDENTIALS = {
  email: 'weight.officer.v2@mandi',
  password: 'Weight@V2'
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('weight_session');
    if (userStr) return JSON.parse(userStr);
  }
  return null;
};

export const login = (email: string, pass: string) => {
  if (email === AUTH_CREDENTIALS.email && pass === AUTH_CREDENTIALS.password) {
    const session = { name: 'Weight Officer V2', role: 'WEIGHT', email };
    localStorage.setItem('weight_session', JSON.stringify(session));
    return true;
  }
  return false;
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('weight_session');
  }
};

export const login = (email: string, password: string) => {
  if (email === 'gate.officer.v2@mandi' && password === 'Gate@V2') {
    const session = { name: 'Gate Officer V2', role: 'GATE' };
    localStorage.setItem('gate_session', JSON.stringify(session));
    return true;
  }
  return false;
}
export const getSession = () => {
  if (typeof window !== 'undefined') {
    const s = localStorage.getItem('gate_session');
    return s ? JSON.parse(s) : null;
  }
  return null;
}
export const logout = () => {
  localStorage.removeItem('gate_session');
}

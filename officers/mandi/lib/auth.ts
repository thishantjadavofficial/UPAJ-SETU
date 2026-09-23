export const USERS = {
  mandi: { email: 'mandi.officer.v2@mandi', password: 'Mandi@V2', sessionData: { name: 'Mandi Officer', role: 'APMC' } },
  gate: { email: 'gate.officer.v2@mandi', password: 'Gate@V2', sessionData: { name: 'Gate Officer', role: 'GATE' } },
  weight: { email: 'weight.officer.v2@mandi', password: 'Weight@V2', sessionData: { name: 'Weight Officer', role: 'WEIGHT' } }
};

export function login(roleKey: 'mandi' | 'gate' | 'weight', email: string, password: string) {
  const target = USERS[roleKey];
  if (email === target.email && password === target.password) {
    localStorage.setItem(roleKey + '_session', JSON.stringify(target.sessionData));
    return true;
  }
  return false;
}

export function logout(roleKey: 'mandi' | 'gate' | 'weight') {
  localStorage.removeItem(roleKey + '_session');
}

export function getSession(roleKey: 'mandi' | 'gate' | 'weight') {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem(roleKey + '_session');
    return session ? JSON.parse(session) : null;
  }
  return null;
}
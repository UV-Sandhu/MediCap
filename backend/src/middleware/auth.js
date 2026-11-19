// STUB
export function requireAuth(req, res, next) {
  req.user = {
    userId: 1,
    fullName: 'System Admin',
    role: 'Admin',
    stationId: null
  };
  next();
}

export default requireAuth;

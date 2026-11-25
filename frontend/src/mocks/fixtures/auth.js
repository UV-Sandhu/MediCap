export const seedUsers = [
  {
    userId: 1,
    fullName: 'System Admin',
    email: 'admin@medicap.local',
    role: 'Admin',
    stationId: null,
    stationName: null,
  },
  {
    userId: 2,
    fullName: 'Karthik Rao',
    email: 'karthik@medicap.local',
    role: 'Operator',
    stationId: 1,
    stationName: 'Station A - Bengaluru Central',
  },
  {
    userId: 3,
    fullName: 'Meera Iyer',
    email: 'meera@medicap.local',
    role: 'Operator',
    stationId: 2,
    stationName: 'Station B - Tumakuru',
  },
  {
    userId: 4,
    fullName: 'Sanjay Patil',
    email: 'sanjay@medicap.local',
    role: 'Operator',
    stationId: 3,
    stationName: 'Station C - Chitradurga',
  },
  {
    userId: 5,
    fullName: 'Divya Shetty',
    email: 'divya@medicap.local',
    role: 'Operator',
    stationId: 4,
    stationName: 'Station D - Mysuru',
  },
  {
    userId: 6,
    fullName: 'Faisal Khan',
    email: 'faisal@medicap.local',
    role: 'Operator',
    stationId: 5,
    stationName: 'Station E - Mangaluru',
  },
];

export function findUser(identifier) {
  if (!identifier) return null;
  const lower = identifier.toLowerCase().trim();
  return (
    seedUsers.find((u) => {
      const emailLower = u.email.toLowerCase();
      const prefix = emailLower.split('@')[0];
      return emailLower === lower || prefix === lower;
    }) || null
  );
}

export function findUserById(id) {
  const numId = Number(id);
  return seedUsers.find((u) => u.userId === numId) || null;
}

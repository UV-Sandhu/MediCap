export const alertHandlers = [
  {
    method: 'GET',
    pattern: /^\/alerts\/count$/,
    handle: () => ({
      open: 4,
      critical: 1,
    }),
  },
];

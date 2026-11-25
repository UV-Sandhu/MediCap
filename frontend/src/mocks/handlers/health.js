export const healthHandlers = [
  {
    method: 'GET',
    pattern: /^\/health$/,
    handle: () => ({
      status: 'ok',
      db: 'up',
      time: new Date().toISOString(),
      simRunning: false,
    }),
  },
];

export function shortStation(name) {
  if (!name) return '';
  return name.split('-')[0].trim();
}

export function roleLabel(user) {
  if (!user) return '';
  if (user.role === 'Admin') return 'Master Control';
  const station = shortStation(user.stationName);
  return station ? `${station} Operator` : 'Operator';
}

export function alertTitle(alertType) {
  switch (alertType) {
    case 'Temperature_Deviation':
      return 'Temperature breach';
    case 'Low_Stock':
      return 'Low stock';
    case 'Near_Expiry':
      return 'Near expiry';
    case 'Pending_Transfer':
      return 'Pending transfer';
    default:
      return alertType || 'Alert';
  }
}

export function stockStatusLabel(status) {
  switch (status) {
    case 'OK':
      return 'OK';
    case 'Low':
      return 'Low stock';
    case 'NearExpiry':
      return 'Near expiry';
    case 'Expired':
      return 'Expired';
    case 'Quarantined':
      return 'Quarantined';
    case 'Damaged':
      return 'Damaged';
    default:
      return status || '';
  }
}

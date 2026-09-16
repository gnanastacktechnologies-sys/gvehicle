export const calculateOilStatus = (vehicle) => {
  const lastOilKm = vehicle.lastOilChangeOdometer || 0;
  const interval = vehicle.engineOilChangeIntervalKm || 5000;
  const currentOdo = vehicle.currentOdometer || 0;

  const nextOilChangeOdometer = lastOilKm + interval;
  const kmRemaining = nextOilChangeOdometer - currentOdo;

  let status = 'NORMAL';
  if (kmRemaining <= 0) {
    status = 'OVERDUE';
  } else if (kmRemaining <= 500) {
    status = 'DUE_SOON';
  }

  return {
    lastOilChangeOdometer: lastOilKm,
    interval,
    nextOilChangeOdometer,
    kmRemaining,
    status,
  };
};

export const calculateTyreStatus = (tyre) => {
  if (!tyre.expectedReplacementDate) {
    return { status: 'NORMAL', daysRemaining: null };
  }

  const now = new Date();
  const dueDate = new Date(tyre.expectedReplacementDate);
  const diffTime = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status = 'NORMAL';
  if (daysRemaining <= 0) {
    status = 'OVERDUE';
  } else if (daysRemaining <= 15) {
    status = 'DUE_SOON';
  }

  return { status, daysRemaining };
};

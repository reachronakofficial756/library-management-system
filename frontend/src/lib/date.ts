/**
 * Lightweight native date utilities — zero external dependencies
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const isPastDate = (date: string | Date): boolean => {
  return new Date(date) < new Date();
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

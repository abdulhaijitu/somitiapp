import { useMemo } from 'react';

/**
 * Determines the range of years a member has been active,
 * from their entry year to current year.
 */
export function useMemberYears(
  joinedAt: string | null | undefined,
  createdAt: string | null | undefined
) {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const referenceDate = joinedAt || createdAt;
    const entryYear = referenceDate
      ? new Date(referenceDate).getFullYear()
      : currentYear;

    const years: number[] = [];
    for (let y = entryYear; y <= currentYear; y++) {
      years.push(y);
    }

    return { years, currentYear, entryYear };
  }, [joinedAt, createdAt]);
}

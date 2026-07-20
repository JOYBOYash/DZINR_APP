export const formatLikesCount = (count: number): string => {
  if (count === undefined || count === null || isNaN(count)) return "0";
  if (count >= 1000000) {
    const val = count / 1000000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 1000) {
    const val = count / 1000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toString();
};

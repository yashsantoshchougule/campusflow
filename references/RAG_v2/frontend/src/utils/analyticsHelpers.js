export const calculatePercentage = (score, total) => {
  if (!total) return 0;
  return Math.round((score / total) * 100);
};

export const getPassStatus = (score) => {
  return score >= 3 ? "Pass" : "Fail";
};

export const getPassStatusClasses = (score) => {
  return score >= 3
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
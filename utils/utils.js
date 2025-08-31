// Normalize phone number function (used throughout)
export const normalizePhoneNumber = (phone) => {
  if (!phone) return "";
  return phone
    .toString()
    .replace(/[\s\-\(\)\+]/g, "")
    .replace(/^91/, "");
};

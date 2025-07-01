export function handleError(error: unknown, message: string) {
  console.log(error, message);
  throw error;
}

export function getInitials(fullName: string) {
  if (!fullName) return "";
  const words = fullName.trim().split(" ");
  // More than one word, take first letter of first and last word
  const firstInitial = words[0][0].toUpperCase();

  return firstInitial;
}

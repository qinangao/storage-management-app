export function handleError(error: unknown, message: string) {
  console.log(error, message);
  throw error;
}

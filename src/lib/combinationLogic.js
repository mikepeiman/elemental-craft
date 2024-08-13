export function combineElements(element1, element2, combinations) {
  const key = [element1, element2].sort().join(',');
  return combinations[key] || null;
}
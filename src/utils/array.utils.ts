export function arrayHasItems(arr: any[]) {
    return Array.isArray(arr) && arr.length > 0;
}

export function arrayAtOrAbove(arr: any[], max: number) {
    return Array.isArray(arr) && arr.length >= max;
}

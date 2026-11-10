// utils/formatDate.ts

export const formatDate = (date: string | undefined, ongoing: boolean = false): string => {
    if (!date || ongoing) return "";
    const parsedDate = new Date(date);
    const isValidDate = !isNaN(parsedDate.getTime());
    return isValidDate ? parsedDate.toISOString().split("T")[0]! : "";
};
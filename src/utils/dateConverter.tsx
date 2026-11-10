export function convertDatesToObjects(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
        return data.map(convertDatesToObjects);
    }

    if (typeof data === "object") {
        const fieldsToConvert = ['startDate', 'endDate', 'validDate'];
        const newData: Record<string, any> = {};

        for (const key in data) {
            if (!data.hasOwnProperty(key)) continue;

            const value = data[key];

            if (value instanceof Date) {
                newData[key] = value; // Keep Date objects as-is
            } else if (fieldsToConvert.includes(key) && typeof value === "string") {
                const parsedDate = new Date(value);
                newData[key] = isNaN(parsedDate.getTime()) ? value : parsedDate;
            } else if (typeof value === "object" && value !== null) {
                newData[key] = convertDatesToObjects(value); // Recurse
            } else {
                newData[key] = value; // Primitives remain unchanged
            }
        }

        return newData;
    }

    return data; // Primitives (string, number, boolean)
}
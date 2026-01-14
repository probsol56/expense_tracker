export const getErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred';

    // 1. Check for standard 'response.data.errors' (ASP.NET ValidationProblem)
    if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        return Object.values(errors).flat().join('\n');
    }

    // 2. Check if 'response.data' itself is the dictionary of errors (Identity sometimes returns this directly)
    if (error.response?.data && typeof error.response.data === 'object') {
        // Filter out non-error properties if any (like "status", "title" if it's mixed)
        // But for the specific format user showed: { "DuplicateEmail": ["..."], ... }
        const values = Object.values(error.response.data);
        if (values.length > 0 && Array.isArray(values[0])) {
            return values.flat().join('\n');
        }
    }

    // 3. Check for specific 'response.data.message' or 'title'
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.title) return error.response.data.title;

    // 4. Fallback to generic message
    return error.message || 'An error occurred';
};

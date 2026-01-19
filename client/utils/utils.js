export const capitalizeFirst = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";


export const truncateText = (text, maxLength = 15) =>
    text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;




function getSizeDisplay(size: number): string {
  if (size > 1000000) {
    return `${Math.round(10 * size/(1024 * 1024)) / 10} MB`;
  } else if (size > 1000) {
    return `${Math.round(10 * size/1024) / 10} KB`;
  }

  return `${size} B`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("de-CH", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Zurich",
});

function getDateDisplay(date: Date): string {
  return dateTimeFormatter.format(date);
}

const downloadBlob = (blob: Blob, fileName: string) => {
  // Create blob link to download
  const url = window.URL.createObjectURL(blob);

  downloadBlobFromUrl(url, fileName);
}

const downloadBlobFromUrl = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `${fileName}`,
  );

  // Append to html link element page
  document.body.appendChild(link);

  // Start download
  link.click();

  // Clean up and remove the link
  link.parentNode.removeChild(link);
}

export {
  getSizeDisplay,
  getDateDisplay,
  downloadBlob,
  downloadBlobFromUrl,
}
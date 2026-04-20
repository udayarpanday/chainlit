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

export {
  getSizeDisplay,
  getDateDisplay,
}
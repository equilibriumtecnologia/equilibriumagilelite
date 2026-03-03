// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function exportToCsv(filename: string, data: any[], headers?: Record<string, string>) {
  if (data.length === 0) return;

  const keys = Object.keys(data[0]);
  const headerRow = keys.map(k => headers?.[k] || k).join(",");
  
  const rows = data.map(row =>
    keys.map(k => {
      const val = row[k];
      if (val === null || val === undefined) return "";
      const str = String(val);
      // Escape quotes and wrap in quotes if contains comma/quote/newline
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(",")
  );

  const csvContent = [headerRow, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

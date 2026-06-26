import * as XLSX from 'xlsx';

/**
 * Export data array ke file Excel (.xlsx)
 *
 * @param {Array<Object>} data - Array of objects (rows)
 * @param {Array<{header: string, key: string}>} columns - Definisi kolom
 * @param {string} filename - Nama file tanpa ekstensi
 */
export const exportToExcel = (data, columns, filename = 'export') => {
  const rows = data.map((item) => {
    const row = {};
    columns.forEach((col) => {
      const value = item[col.key];
      row[col.header] = value !== null && value !== undefined ? value : '';
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = columns.map((col) => {
    const maxLen = Math.max(
      col.header.length,
      ...data.map((item) => {
        const val = item[col.key];
        return val ? String(val).length : 0;
      })
    );
    return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

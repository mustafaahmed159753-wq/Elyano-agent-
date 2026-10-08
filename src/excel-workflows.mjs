function isEmptyCell(cell) {
  return cell.value === null || cell.value === undefined
    || (typeof cell.value === "string" && cell.value.trim() === "");
}

function cellKey(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (typeof value.formula === "string") return `formula:${value.formula}`;
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
    return JSON.stringify(value);
  }
  return String(value).trim().toLocaleLowerCase();
}

export function applyExcelTaskPlan(sheet, headers, plan) {
  let changedCells = 0;
  let removedRows = 0;
  for (const operation of plan.operations) {
    if (operation.type === "trimText") {
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const row = sheet.getRow(rowNumber);
        for (let column = 1; column <= sheet.columnCount; column += 1) {
          const cell = row.getCell(column);
          if (typeof cell.value === "string") {
            const trimmed = cell.value.trim();
            if (trimmed !== cell.value) {
              cell.value = trimmed;
              changedCells += 1;
            }
          }
        }
      }
    } else if (operation.type === "removeBlankRows") {
      for (let rowNumber = sheet.rowCount; rowNumber >= 2; rowNumber -= 1) {
        const row = sheet.getRow(rowNumber);
        if (Array.from({ length: sheet.columnCount }, (_, index) => row.getCell(index + 1)).every(isEmptyCell)) {
          sheet.spliceRows(rowNumber, 1);
          removedRows += 1;
        }
      }
    } else if (operation.type === "removeDuplicateRows") {
      const indexes = operation.columns.map((name) => headers.findIndex((header) => header === name) + 1);
      const seen = new Set();
      const duplicateRows = [];
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const row = sheet.getRow(rowNumber);
        const key = JSON.stringify(indexes.map((column) => cellKey(row.getCell(column).value)));
        if (seen.has(key)) duplicateRows.push(rowNumber);
        else seen.add(key);
      }
      for (const rowNumber of duplicateRows.reverse()) {
        sheet.spliceRows(rowNumber, 1);
        removedRows += 1;
      }
    } else if (operation.type === "fillBlankCells") {
      const column = headers.findIndex((header) => header === operation.column) + 1;
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const cell = sheet.getRow(rowNumber).getCell(column);
        if (isEmptyCell(cell)) {
          cell.value = operation.value;
          changedCells += 1;
        }
      }
    } else if (operation.type === "normalizeCase") {
      const column = headers.findIndex((header) => header === operation.column) + 1;
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const cell = sheet.getRow(rowNumber).getCell(column);
        if (typeof cell.value === "string") {
          const normalized = operation.mode === "upper" ? cell.value.toLocaleUpperCase() : cell.value.toLocaleLowerCase();
          if (normalized !== cell.value) {
            cell.value = normalized;
            changedCells += 1;
          }
        }
      }
    } else if (operation.type === "renameHeader") {
      const column = headers.findIndex((header) => header === operation.from) + 1;
      sheet.getRow(1).getCell(column).value = operation.to;
      headers[column - 1] = operation.to;
      changedCells += 1;
    }
  }
  return { changedCells, removedRows };
}

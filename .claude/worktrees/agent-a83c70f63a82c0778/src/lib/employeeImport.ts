export interface EmployeeImportRow {
  rut: string;
  name: string;
  position: string;
  department: string;
  email: string;
}

const normalizeText = (value: unknown): string => String(value ?? '').trim();

export const normalizeRut = (rut: string): string =>
  rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();

export const isValidRut = (rut: string): boolean => {
  const normalized = normalizeRut(rut);
  if (!/^\d{7,8}-[\dK]$/.test(normalized)) return false;
  const [body, verifier] = normalized.split('-');
  let sum = 0;
  let multiplier = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const result = 11 - (sum % 11);
  const expected = result === 11 ? '0' : result === 10 ? 'K' : String(result);
  return verifier === expected;
};

export const employeeEmailFromRut = (rut: string): string =>
  `${normalizeRut(rut).replace('-', '').toLowerCase()}@acceso.soldesp.cl`;

export const parseEmployeeWorkbook = async (file: File): Promise<EmployeeImportRow[]> => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const firstSheet = workbook.worksheets[0];
  if (!firstSheet) throw new Error('El archivo no contiene hojas.');
  const headers = new Map<string, number>();
  firstSheet.getRow(1).eachCell((cell, column) => headers.set(normalizeText(cell.value).toUpperCase(), column));
  const requiredHeaders = ['RUT', 'AP PATERNO', 'AP MATERNO', 'NOMBRES', 'CARGO', 'AREA'];
  const missing = requiredHeaders.filter(header => !headers.has(header));
  if (missing.length) throw new Error(`Faltan columnas requeridas: ${missing.join(', ')}`);
  const rows: Record<string, unknown>[] = [];
  firstSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    rows.push(Object.fromEntries(requiredHeaders.map(header => [header, row.getCell(headers.get(header)!).value])));
  });
  const seen = new Set<string>();

  return rows.map((row, index) => {
    const rut = normalizeText(row.RUT);
    const normalizedRut = normalizeRut(rut);
    if (!isValidRut(normalizedRut)) throw new Error(`RUT inválido en la fila ${index + 2}: ${rut || 'vacío'}`);
    if (seen.has(normalizedRut)) throw new Error(`RUT duplicado en la fila ${index + 2}: ${rut}`);
    seen.add(normalizedRut);

    const name = [
      normalizeText(row.NOMBRES),
      normalizeText(row['AP PATERNO']),
      normalizeText(row['AP MATERNO'])
    ].filter(Boolean).join(' ');
    if (!name) throw new Error(`Nombre vacío en la fila ${index + 2}.`);

    return {
      rut,
      name,
      position: normalizeText(row.CARGO),
      department: normalizeText(row.AREA),
      email: employeeEmailFromRut(rut)
    };
  });
};

export const downloadCredentialsCsv = (
  credentials: Array<{ rut: string; name: string; email: string; password: string }>
): void => {
  void (async () => {
    const { default: ExcelJS } = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Credenciales');
    sheet.columns = [
      { header: 'RUT', key: 'rut', width: 18 },
      { header: 'NOMBRE', key: 'name', width: 40 },
      { header: 'CORREO', key: 'email', width: 36 },
      { header: 'CONTRASENA_INICIAL', key: 'password', width: 24 }
    ];
    credentials.forEach(item => sheet.addRow(item));
    sheet.getRow(1).font = { bold: true };
    const blob = new Blob([await workbook.xlsx.writeBuffer()], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'credenciales-iniciales-capacita-pro.xlsx';
    link.click();
    URL.revokeObjectURL(link.href);
  })();
};

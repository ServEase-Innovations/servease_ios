import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type InvoicePdfInput = {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  serviceAddress: string;
  bookingId: string | number;
  serviceType: string;
  taskType?: string;
  schedule: string;
  bookingType: string;
  timeSlot: string;
  providerName: string;
  baseAmount: number;
  couponDiscount: number;
  platformFee: number;
  gst: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMode: string;
  transactionId?: string;
};

const COMPANY = {
  name: 'ServEaso Private Limited',
  address: '#58, 5th Main, Sir MV Nagar, Ramamurthy Nagar, Bengaluru - 560016',
  pan: 'ABPCS0218M',
  gst: '29AAGCP05621PZV',
  tan: 'BLRS43846E',
  cin: 'U74900KA2021PTC152324',
  phone: '080-123456789',
  email: 'support@serveaso.com',
  website: 'www.serveaso.com',
};

/** pdf-lib standard fonts only support WinAnsi — strip unsupported chars. */
function sanitizePdfText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(text: string, maxChars: number): string[] {
  const safe = sanitizePdfText(text);
  if (!safe) return [''];
  const words = safe.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawLines(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  lines: string[],
  x: number,
  y: number,
  size: number,
  color = rgb(0.2, 0.2, 0.2)
): number {
  let cursor = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cursor, size, font, color });
    cursor -= size + 4;
  }
  return cursor;
}

function drawRow(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  bold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  label: string,
  value: string,
  y: number,
  valueFont = font
): number {
  page.drawText(sanitizePdfText(label), { x: 50, y, size: 10, font });
  const valueText = sanitizePdfText(value);
  const valueWidth = valueFont.widthOfTextAtSize(valueText, 10);
  page.drawText(valueText, { x: 545 - valueWidth, y, size: 10, font: valueFont });
  return y - 16;
}

export async function generateInvoicePdfBase64(input: InvoicePdfInput): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const headerColor = rgb(0.12, 0.24, 0.45);
  const muted = rgb(0.35, 0.35, 0.35);

  page.drawRectangle({
    x: 0,
    y: 793,
    width: 595.28,
    height: 48,
    color: headerColor,
  });
  page.drawText('ServEaso', { x: 50, y: 820, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Tax Invoice / Cash Memo / Bill of Supply', {
    x: 50,
    y: 802,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  const invoiceNo = sanitizePdfText(`Invoice No: ${input.invoiceNumber}`);
  const invoiceDate = sanitizePdfText(`Date: ${input.invoiceDate}`);
  page.drawText(invoiceNo, {
    x: 545 - font.widthOfTextAtSize(invoiceNo, 10),
    y: 820,
    size: 10,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(invoiceDate, {
    x: 545 - font.widthOfTextAtSize(invoiceDate, 10),
    y: 804,
    size: 10,
    font,
    color: rgb(1, 1, 1),
  });

  let y = 770;
  page.drawText(sanitizePdfText(COMPANY.name), { x: 50, y, size: 11, font: bold, color: headerColor });
  y = drawLines(page, font, wrapText(COMPANY.address, 42), 50, y - 16, 9, muted);
  y = drawLines(
    page,
    font,
    wrapText(`PAN: ${COMPANY.pan} | GST: ${COMPANY.gst}`, 42),
    50,
    y - 4,
    9,
    muted
  );

  let rightY = 770;
  page.drawText('Customer', { x: 310, y: rightY, size: 11, font: bold, color: headerColor });
  rightY = drawLines(page, font, wrapText(input.customerName, 38), 310, rightY - 16, 9, muted);
  rightY = drawLines(page, font, wrapText(input.customerAddress, 38), 310, rightY - 4, 9, muted);
  rightY = drawLines(
    page,
    font,
    wrapText(`Service address: ${input.serviceAddress}`, 38),
    310,
    rightY - 4,
    9,
    muted
  );

  y = Math.min(y, rightY) - 20;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 18;

  page.drawText('Booking Details', { x: 50, y, size: 11, font: bold, color: headerColor });
  y -= 18;
  y = drawRow(page, font, bold, 'Booking ID', String(input.bookingId), y);
  y = drawRow(page, font, bold, 'Service Type', input.serviceType, y);
  if (input.taskType) {
    y = drawRow(page, font, bold, 'Task Type', input.taskType, y);
  }
  y = drawRow(page, font, bold, 'Schedule', input.schedule, y);
  y = drawRow(page, font, bold, 'Booking Type', input.bookingType, y);
  y = drawRow(page, font, bold, 'Time Slot', input.timeSlot, y);
  y = drawRow(page, font, bold, 'Service Provider', input.providerName, y);

  y -= 8;
  page.drawText('Payment Summary', { x: 50, y, size: 11, font: bold, color: headerColor });
  y -= 18;
  y = drawRow(page, font, bold, 'Base Amount', `Rs.${input.baseAmount.toFixed(2)}`, y);
  if (input.couponDiscount > 0) {
    y = drawRow(page, font, bold, 'Coupon Applied', `- Rs.${input.couponDiscount.toFixed(2)}`, y);
  }
  y = drawRow(page, font, bold, 'Platform Fee', `Rs.${input.platformFee.toFixed(2)}`, y);
  y = drawRow(page, font, bold, 'GST (18%)', `Rs.${input.gst.toFixed(2)}`, y);
  y = drawRow(page, font, bold, 'Total Amount', `Rs.${input.totalAmount.toFixed(2)}`, y, bold);
  y = drawRow(page, font, bold, 'Payment Status', input.paymentStatus, y);
  y = drawRow(page, font, bold, 'Payment Mode', input.paymentMode, y);
  if (input.transactionId) {
    y = drawLines(page, font, wrapText(`Transaction ID: ${input.transactionId}`, 90), 50, y - 4, 9, muted);
  }

  y -= 10;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });
  y -= 14;
  y = drawLines(page, font, wrapText(`${COMPANY.name} | ${COMPANY.address}`, 95), 50, y, 8, muted);
  y = drawLines(
    page,
    font,
    wrapText(`CIN: ${COMPANY.cin} | PAN: ${COMPANY.pan} | GST: ${COMPANY.gst} | TAN: ${COMPANY.tan}`, 95),
    50,
    y - 2,
    8,
    muted
  );
  y = drawLines(
    page,
    font,
    wrapText(`Phone: ${COMPANY.phone} | Email: ${COMPANY.email} | Web: ${COMPANY.website}`, 95),
    50,
    y - 2,
    8,
    muted
  );
  drawLines(
    page,
    font,
    wrapText('This is a computer generated invoice and does not require a physical signature.', 95),
    50,
    y - 2,
    8,
    muted
  );

  const bytes = await pdfDoc.save();
  return bytesToBase64(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof global.btoa === 'function') {
    return global.btoa(binary);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < binary.length) {
    const byte1 = binary.charCodeAt(i++);
    const byte2 = binary.charCodeAt(i++);
    const byte3 = binary.charCodeAt(i++);
    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    let enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    let enc4 = byte3 & 63;
    if (Number.isNaN(byte2)) {
      enc3 = 64;
      enc4 = 64;
    } else if (Number.isNaN(byte3)) {
      enc4 = 64;
    }
    output +=
      chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

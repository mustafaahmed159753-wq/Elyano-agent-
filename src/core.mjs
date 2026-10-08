import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { isIPv4 } from "node:net";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 256) {
    throw new Error("Password must be between 12 and 256 characters.");
  }
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${Buffer.from(derived).toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") return false;
  const [scheme, saltHex, hashHex] = storedHash.split(":");
  if (scheme !== "scrypt" || !/^[a-f0-9]{32}$/i.test(saltHex || "") || !/^[a-f0-9]{128}$/i.test(hashHex || "")) {
    return false;
  }
  const derived = Buffer.from(await scrypt(password, Buffer.from(saltHex, "hex"), 64));
  const expected = Buffer.from(hashHex, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function normalizeUsername(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isPrivateIPv4(address) {
  if (typeof address !== "string" || !isIPv4(address)) return false;
  const [a, b] = address.split(".").map(Number);
  return a === 10
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168);
}

export function normalizePingTargets(value) {
  if (!Array.isArray(value) || value.length > 30) {
    throw new Error("Configure no more than 30 private IPv4 ping targets.");
  }
  const seen = new Set();
  return value.map((item) => {
    const ipValue = typeof item === "string" ? item : typeof item?.ip === "string" ? item.ip : "";
    const labelValue = typeof item?.label === "string" ? item.label : "";
    const ip = ipValue.trim();
    const label = labelValue.trim();
    if (!ip || !isPrivateIPv4(ip)) {
      throw new Error("Ping targets must be private IPv4 addresses (10/8, 172.16/12, or 192.168/16). Hostnames and public IPs are not accepted.");
    }
    if (seen.has(ip)) throw new Error(`Ping target ${ip} is listed more than once.`);
    if (label.length > 80) throw new Error("Ping target labels must be 80 characters or fewer.");
    seen.add(ip);
    return { ip, label };
  });
}

export function isTechnicalIssue(text) {
  if (typeof text !== "string") return false;
  const hasTechnicalTopic = /(computer|workstation|laptop|desktop|printer|printing|network|wifi|wi-fi|internet|email|outlook|login|log in|password|account|software|application|system|excel|word|vpn|barcode|scanner|server|technical|pc\b|الكمبيوتر|كمبيوتر|حاسوب|جهاز|طابعة|طابعه|الشبكة|شبكة|الإنترنت|انترنت|واي.?فاي|الواي.?فاي|الإيميل|الايميل|تسجيل الدخول|كلمة المرور|الباسورد|النظام|السيستم|مشكلة فنية|عطل|اكسل|إكسل|اوفيس|أوفيس|الطباعة|الطابعه)/i.test(text);
  const hasFailure = /(not working|doesn't work|does not work|won't|cannot|can't|unable to|keeps failing|error|failed|failure|crash|broken|stuck|down|disconnect|issue|problem|عطل|عطلان|مش شغال|مش شغاله|مش شغّال|لا يعمل|لا تعمل|ما بيشتغلش|مش بيشتغل|مش بتفتح|مش بيفتح|لا يفتح|خطأ|مشكلة|فيه مشكلة|فشل|واقف|فاصل|قاطع|مش راضي|مش راضية|مش قادر|مش قادره|بيفصل|بتفصل)/i.test(text);
  return hasTechnicalTopic && hasFailure && text.trim().length >= 8;
}

export function isDirectoryQuestion(text) {
  if (typeof text !== "string") return false;
  return /(phone|extension|telephone|department number|number for|call|contact|directory|office|room|location|on.?duty|shift|email|رقم|تليفون|تحويلة|هاتف|اتصال|دليل|جهة الاتصال|مكتب|قسم|عنوان|موقع|مناوب|الوردية|إيميل|الايميل|بريد إلكتروني)/i.test(text);
}

export function decodeMuLaw(byte) {
  const value = (~byte) & 0xff;
  const sign = value & 0x80;
  const exponent = (value >> 4) & 0x07;
  const mantissa = value & 0x0f;
  let sample = ((mantissa << 3) + 0x84) << exponent;
  sample -= 0x84;
  return sign ? -sample : sample;
}

export function encodeMuLaw(sample) {
  const value = Math.max(-32635, Math.min(32635, Math.trunc(sample)));
  const sign = value < 0 ? 0x80 : 0;
  const magnitude = Math.min(32635, Math.abs(value)) + 0x84;
  let exponent = 7;
  for (let mask = 0x4000; exponent > 0 && !(magnitude & mask); mask >>= 1) exponent -= 1;
  const mantissa = (magnitude >> (exponent + 3)) & 0x0f;
  return (~(sign | (exponent << 4) | mantissa)) & 0xff;
}

export function upsamplePcmuTo16Khz(encoded) {
  const output = Buffer.allocUnsafe(encoded.length * 4);
  for (let index = 0; index < encoded.length; index += 1) {
    const current = decodeMuLaw(encoded[index]);
    const next = decodeMuLaw(encoded[Math.min(index + 1, encoded.length - 1)]);
    output.writeInt16LE(current, index * 4);
    output.writeInt16LE(Math.trunc((current + next) / 2), index * 4 + 2);
  }
  return output;
}

export function downsamplePcm24KhzToPcmu(pcm) {
  const sampleCount = Math.floor(pcm.length / 2);
  const output = Buffer.allocUnsafe(Math.floor(sampleCount / 3));
  for (let source = 0, target = 0; source + 2 < sampleCount; source += 3, target += 1) {
    const sample = Math.trunc((
      pcm.readInt16LE(source * 2)
      + pcm.readInt16LE((source + 1) * 2)
      + pcm.readInt16LE((source + 2) * 2)
    ) / 3);
    output[target] = encodeMuLaw(sample);
  }
  return output;
}

export function safeFilename(value) {
  return String(value || "download")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 120) || "download";
}

export function validateDocumentSpec(type, spec) {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
    throw new Error("The AI returned an invalid document structure.");
  }

  if (type === "xlsx") {
    if (!Array.isArray(spec.columns) || !Array.isArray(spec.rows) || spec.columns.length < 1 || spec.columns.length > 30 || spec.rows.length > 500) {
      throw new Error("Spreadsheet must contain 1–30 columns and no more than 500 rows.");
    }
    const columns = spec.columns.map((column) => {
      if (typeof column !== "string" || !column.trim() || column.length > 80) {
        throw new Error("Spreadsheet column names must be short text.");
      }
      return column.trim();
    });
    const rows = spec.rows.map((row) => {
      if (!Array.isArray(row) || row.length > columns.length) {
        throw new Error("Spreadsheet row does not match its columns.");
      }
      return row.map((cell) => {
        if (cell === null || ["string", "number", "boolean"].includes(typeof cell)) return cell ?? "";
        throw new Error("Spreadsheet cells must be plain text or numbers.");
      });
    });
    return { title: String(spec.title || "Elyano Worksheet").slice(0, 120), columns, rows };
  }
  if (type === "docx") {
    if (typeof spec.title !== "string" || !Array.isArray(spec.paragraphs) || spec.paragraphs.length > 300) {
      throw new Error("Document must contain a title and no more than 300 paragraphs.");
    }
    const paragraphs = spec.paragraphs.map((paragraph) => {
      if (typeof paragraph !== "string" || paragraph.length > 5000) {
        throw new Error("Document paragraphs must be plain text under 5,000 characters.");
      }
      return paragraph;
    });
    return {
      title: spec.title.slice(0, 200),
      paragraphs,
      bullets: Array.isArray(spec.bullets) ? spec.bullets.filter((item) => typeof item === "string").slice(0, 100) : [],
    };
  }
  throw new Error("Choose either a Word document or an Excel workbook.");
}

export function validateExcelTaskPlan(headers, plan) {
  if (!Array.isArray(headers) || headers.length < 1 || !plan || typeof plan !== "object"
      || !Array.isArray(plan.operations) || plan.operations.length < 1 || plan.operations.length > 12) {
    throw new Error("The Excel task must contain 1–12 supported operations and a worksheet with headers.");
  }
  const currentHeaders = [...headers];
  const findHeader = (value) => {
    if (typeof value !== "string" || !value.trim()) throw new Error("Excel operations must identify a column by its header.");
    const matches = currentHeaders.flatMap((header, index) => (
      typeof header === "string" && header.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase()
        ? [index]
        : []
    ));
    if (matches.length !== 1) throw new Error(`Column "${value}" must match exactly one worksheet header.`);
    return currentHeaders[matches[0]].trim();
  };

  return {
    operations: plan.operations.map((operation) => {
      if (!operation || typeof operation !== "object" || Array.isArray(operation)) {
        throw new Error("The Excel task returned an invalid operation.");
      }
      if (operation.type === "trimText" || operation.type === "removeBlankRows") {
        return { type: operation.type };
      }
      if (operation.type === "removeDuplicateRows") {
        if (!Array.isArray(operation.columns) || operation.columns.length < 1 || operation.columns.length > 20) {
          throw new Error("Duplicate removal must use 1–20 existing column headers.");
        }
        const columns = operation.columns.map(findHeader);
        if (new Set(columns.map((column) => column.toLocaleLowerCase())).size !== columns.length) {
          throw new Error("Duplicate-removal columns must be unique.");
        }
        return { type: operation.type, columns };
      }
      if (operation.type === "fillBlankCells") {
        const column = findHeader(operation.column);
        if (typeof operation.value !== "string" || operation.value.length > 500) {
          throw new Error("Fill values must be plain text under 500 characters.");
        }
        return { type: operation.type, column, value: operation.value };
      }
      if (operation.type === "normalizeCase") {
        const column = findHeader(operation.column);
        if (!["upper", "lower"].includes(operation.mode)) {
          throw new Error("Text normalization must use upper or lower case.");
        }
        return { type: operation.type, column, mode: operation.mode };
      }
      if (operation.type === "renameHeader") {
        const from = findHeader(operation.from);
        if (typeof operation.to !== "string" || !operation.to.trim() || operation.to.trim().length > 80) {
          throw new Error("New column headers must be 1–80 characters.");
        }
        if (currentHeaders.some((header) => typeof header === "string" && header.trim().toLocaleLowerCase() === operation.to.trim().toLocaleLowerCase())) {
          throw new Error(`Column "${operation.to}" already exists.`);
        }
        currentHeaders[currentHeaders.findIndex((header) => header === from)] = operation.to.trim();
        return { type: operation.type, from, to: operation.to.trim() };
      }
      throw new Error(`Unsupported Excel operation "${String(operation.type || "")}".`);
    }),
  };
}

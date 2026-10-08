import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { applyExcelTaskPlan } from "../src/excel-workflows.mjs";
import { decodeMuLaw, downsamplePcm24KhzToPcmu, encodeMuLaw, hashPassword, isDirectoryQuestion, isPrivateIPv4, isTechnicalIssue, normalizePingTargets, normalizeUsername, safeFilename, upsamplePcmuTo16Khz, validateDocumentSpec, validateExcelTaskPlan, verifyPassword } from "../src/core.mjs";

test("passwords are salted, verified, and never stored in clear text", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery staple", first), true);
  assert.equal(await verifyPassword("incorrect password", first), false);
  assert.equal(await verifyPassword("correct horse battery staple", "not-a-hash"), false);
});

test("password policy rejects short passwords", async () => {
  await assert.rejects(hashPassword("short"), /12 and 256/);
});

test("username and download filenames are normalized safely", () => {
  assert.equal(normalizeUsername("  Nurse.Example  "), "nurse.example");
  assert.equal(safeFilename("../reports:Q1?.xlsx"), "_reports_Q1_.xlsx");
});

test("ping monitor accepts only unique private IPv4 targets", () => {
  assert.equal(isPrivateIPv4("10.11.0.25"), true);
  assert.equal(isPrivateIPv4("172.20.1.4"), true);
  assert.equal(isPrivateIPv4("192.168.1.7"), true);
  assert.equal(isPrivateIPv4("8.8.8.8"), false);
  assert.equal(isPrivateIPv4("localhost"), false);
  assert.deepEqual(normalizePingTargets([{ ip: "10.11.0.25", label: "Ward PC" }]), [{ ip: "10.11.0.25", label: "Ward PC" }]);
  assert.throws(() => normalizePingTargets(["10.11.0.25", "10.11.0.25"]), /more than once/);
  assert.throws(() => normalizePingTargets([{ ip: 10110025 }]), /private IPv4/);
  assert.throws(() => normalizePingTargets(["8.8.8.8"]), /private IPv4/);
  assert.throws(() => normalizePingTargets(["10.11.0.999"]), /private IPv4/);
  assert.throws(() => normalizePingTargets(Array.from({ length: 31 }, (_, index) => `10.0.0.${index + 1}`)), /no more than 30/);
});

test("technical issue classifier catches Arabic and English failure reports without treating questions as incidents", () => {
  assert.equal(isTechnicalIssue("الكمبيوتر مش شغال"), true);
  assert.equal(isTechnicalIssue("الطابعة لا تعمل في القسم"), true);
  assert.equal(isTechnicalIssue("My network is down"), true);
  assert.equal(isTechnicalIssue("How do I use Excel?"), false);
  assert.equal(isTechnicalIssue(""), false);
});

test("directory lookup intent covers contact, location, shift, and Arabic requests", () => {
  assert.equal(isDirectoryQuestion("What is the radiology extension?"), true);
  assert.equal(isDirectoryQuestion("Who is on duty in IT?"), true);
  assert.equal(isDirectoryQuestion("ما رقم هاتف قسم الأشعة؟"), true);
  assert.equal(isDirectoryQuestion("أين مكتب الموارد البشرية؟"), true);
  assert.equal(isDirectoryQuestion("Can you help me write a report?"), false);
});

test("voice call audio conversion preserves G.711 and sample-rate framing", () => {
  for (const sample of [-16000, -4000, 0, 4000, 16000]) {
    const decoded = decodeMuLaw(encodeMuLaw(sample));
    assert.ok(Math.abs(decoded - sample) < 1200);
  }
  const encoded = Buffer.alloc(160, encodeMuLaw(1000));
  const upsampled = upsamplePcmuTo16Khz(encoded);
  assert.equal(upsampled.length, 640);
  const pcm24 = Buffer.alloc(480 * 2);
  for (let index = 0; index < 480; index += 1) pcm24.writeInt16LE(2000, index * 2);
  assert.equal(downsamplePcm24KhzToPcmu(pcm24).length, 160);
});

test("document structures enforce bounded, plain cell data", () => {
  const workbook = validateDocumentSpec("xlsx", { columns: ["Task"], rows: [["Call"], [2]] });
  assert.deepEqual(workbook.columns, ["Task"]);
  assert.equal(workbook.rows.length, 2);
  assert.throws(() => validateDocumentSpec("xlsx", { columns: ["Task"], rows: [[{}]] }), /plain text or numbers/);
  assert.throws(() => validateDocumentSpec("docx", { title: "", paragraphs: [1] }), /plain text/);
});

test("Excel workflow plans allow only bounded operations on existing headers", () => {
  const plan = validateExcelTaskPlan(
    ["Department", "Status"],
    { operations: [
      { type: "trimText" },
      { type: "removeDuplicateRows", columns: ["Department", "Status"] },
      { type: "normalizeCase", column: "status", mode: "upper" },
      { type: "fillBlankCells", column: "Department", value: "Unassigned" },
      { type: "renameHeader", from: "Status", to: "Work status" },
      { type: "normalizeCase", column: "Work status", mode: "lower" },
    ] },
  );
  assert.equal(plan.operations.length, 6);
  assert.deepEqual(plan.operations[2], { type: "normalizeCase", column: "Status", mode: "upper" });
  assert.deepEqual(plan.operations[5], { type: "normalizeCase", column: "Work status", mode: "lower" });
  assert.throws(() => validateExcelTaskPlan(["Name", "Name"], { operations: [{ type: "normalizeCase", column: "Name", mode: "upper" }] }), /exactly one/);
  assert.throws(() => validateExcelTaskPlan(["Name"], { operations: [{ type: "executeFormula", formula: "=HYPERLINK(...)" }] }), /Unsupported Excel operation/);
  assert.throws(() => validateExcelTaskPlan(["Name"], { operations: [{ type: "fillBlankCells", column: "Name", value: { formula: "SUM(A:A)" } }] }), /plain text/);
});

test("Excel task operations retain the first duplicate and leave formulas alone", () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Roster");
  sheet.addRow(["ID", "Status", "Person", "Formula"]);
  sheet.addRow([" 1 ", "", " mary ", { formula: "1+1", result: 2 }]);
  sheet.addRow(["1", "Open", "Mary", "plain"]);
  sheet.addRow([null, null, null, null]);
  const headers = ["ID", "Status", "Person", "Formula"];
  const result = applyExcelTaskPlan(sheet, headers, { operations: [
    { type: "trimText" },
    { type: "removeBlankRows" },
    { type: "removeDuplicateRows", columns: ["ID"] },
    { type: "fillBlankCells", column: "Status", value: "Pending" },
    { type: "normalizeCase", column: "Person", mode: "upper" },
    { type: "renameHeader", from: "Status", to: "Current Status" },
  ] });
  assert.equal(sheet.rowCount, 2);
  assert.equal(sheet.getCell("A2").value, "1");
  assert.equal(sheet.getCell("B2").value, "Pending");
  assert.equal(sheet.getCell("C2").value, "MARY");
  assert.deepEqual(sheet.getCell("D2").value, { formula: "1+1", result: 2 });
  assert.equal(sheet.getCell("B1").value, "Current Status");
  assert.equal(result.removedRows, 2);
  assert.equal(result.changedCells, 5);
});

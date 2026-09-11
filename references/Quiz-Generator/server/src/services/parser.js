import pdf from "pdf-parse";
import mammoth from "mammoth";
import PizZip from "pizzip";
import { Document } from "../models/Document.js";
import { Block } from "../models/Block.js";

export async function parseDocument(
  documentId,
  buffer,
  fileType,
  sessionId,
  expiresAt
) {
  try {
    let blocks = [];

    switch (fileType) {
      case "pdf":
        blocks = await parsePDF(buffer);
        break;
      case "docx":
        blocks = await parseDOCX(buffer);
        break;
      case "pptx":
        blocks = await parsePPTX(buffer);
        break;
      case "txt":
        blocks = parseTXT(buffer);
        break;
      default:
        throw new Error("Unsupported file type");
    }

    // Save blocks
    const blockDocs = blocks.map((block, idx) => ({
      documentId,
      sessionId,
      sourceRef: block.sourceRef,
      text: block.text,
      orderIndex: idx,
      expiresAt,
    }));

    await Block.insertMany(blockDocs);

    // Update document status
    const stats = {
      blockCount: blocks.length,
      wordCount: blocks.reduce((sum, b) => sum + b.text.split(/\s+/).length, 0),
      pageCount: fileType === "pdf" ? blocks.length : undefined,
      slideCount: fileType === "pptx" ? blocks.length : undefined,
    };

    await Document.findByIdAndUpdate(documentId, {
      status: "completed",
      stats,
    });
  } catch (error) {
    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
      error: error.message,
    });
    throw error;
  }
}

async function parsePDF(buffer) {
  const data = await pdf(buffer);
  const pages = data.text.split("\f"); // Form feed separator

  return pages
    .map((text, idx) => ({
      sourceRef: `page-${idx + 1}`,
      text: text.trim(),
    }))
    .filter((block) => block.text.length > 0);
}

async function parseDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const paragraphs = result.value
    .split("\n")
    .filter((p) => p.trim().length > 0);

  // Group paragraphs into sections (every 5 paragraphs or by content)
  const blocks = [];
  for (let i = 0; i < paragraphs.length; i += 5) {
    const chunk = paragraphs.slice(i, i + 5).join("\n");
    blocks.push({
      sourceRef: `section-${Math.floor(i / 5) + 1}`,
      text: chunk,
    });
  }

  return blocks;
}

async function parsePPTX(buffer) {
  try {
    const zip = new PizZip(buffer);
    const slides = [];

    // Extract slide text from XML
    const slideFiles = Object.keys(zip.files).filter(
      (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
    );

    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = zip.files[slideFiles[i]].asText();
      // Extract text between <a:t> tags
      const textMatches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g) || [];
      const text = textMatches
        .map((match) => match.replace(/<\/?a:t>/g, ""))
        .join("\n");

      if (text.trim().length > 0) {
        slides.push({
          sourceRef: `slide-${i + 1}`,
          text: text.trim(),
        });
      }
    }

    return slides.length > 0
      ? slides
      : [
          {
            sourceRef: "slide-1",
            text: "PPTX parsing limited - please use PDF version for better results",
          },
        ];
  } catch (error) {
    console.error("PPTX parse error:", error);
    return [
      {
        sourceRef: "slide-1",
        text: "PPTX parsing failed - please upload PDF or DOCX version",
      },
    ];
  }
}

function parseTXT(buffer) {
  const text = buffer.toString("utf-8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  // Group lines into blocks
  const blocks = [];
  for (let i = 0; i < lines.length; i += 10) {
    const chunk = lines.slice(i, i + 10).join("\n");
    blocks.push({
      sourceRef: `lines-${i + 1}-${Math.min(i + 10, lines.length)}`,
      text: chunk,
    });
  }

  return blocks;
}

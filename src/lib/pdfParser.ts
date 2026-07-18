// PDF 解析与正文过滤引擎
// 使用 pdf.js 抽取文本,通过启发式规则识别目录、注脚、注示等非正文内容

import * as pdfjsLib from "pdfjs-dist";
// 使用 Vite 变量引入 worker,避免手工配置 workerSrc
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.js?url";
import type {
  FilterRules,
  Paragraph,
  ParagraphKind,
  ParsedPdf,
} from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

interface TextLine {
  text: string;
  x: number; // 行起始 x 坐标(用于检测首行缩进)
  y: number;
}

const KIND_LABELS: Record<ParagraphKind, string> = {
  body: "正文",
  title: "书名",
  heading: "标题",
  toc: "目录",
  footnote: "注脚",
  annotation: "注示",
  header_footer: "页眉页脚",
  references: "参考文献",
  copyright: "版权页",
};

const REFERENCE_KEYWORDS = [
  "参考文献",
  "References",
  "REFERENCES",
  "Bibliography",
  "BIBLIOGRAPHY",
  "Works Cited",
  "引用文献",
  "文献综述",
];

const COPYRIGHT_KEYWORDS = [
  "版权所有",
  "Copyright",
  "COPYRIGHT",
  "All rights reserved",
  "ALL RIGHTS RESERVED",
  "保留所有权利",
  "未经许可",
];

const ANNOTATION_PREFIXES = [
  "注:",
  "注：",
  "注释:",
  "注释：",
  "注解:",
  "注解：",
  "Note:",
  "NOTE:",
  "Annotation:",
  "附注:",
  "附注：",
];

// 目录行:行中带连续点或长空格并以页码结尾
const TOC_LINE =
  /^(.+?[\.\．。…\s]{3,}\d{1,4})\s*$|^(.+?\.{4,}\s*\d{1,4})\s*$/;

// 上标式注脚:[1] ① 1) * †
const FOOTNOTE_PREFIX =
  /^\s*(\[\d{1,3}\]|[①②③④⑤⑥⑦⑧⑨⑩]|\(\d{1,3}\)|\d{1,3}[\.\)]|[\*\u2020\u2021\u00a7])\s+/;

// 短行(疑似页眉页脚)
const SHORT_LINE_MAX = 80;

// 句末终止标点(中英文):用于判断段落是否结束
const TERMINAL_PUNCT = /[。！？!?…\u2026]$/;

export async function parsePdf(
  file: File,
  rules: FilterRules,
  onProgress?: (loaded: number, total: number) => void
): Promise<ParsedPdf> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const totalPages = doc.numPages;

  const rawParagraphs: Paragraph[] = [];
  let id = 0;
  let referencesStarted = false;

  // 跨页累积的正文缓冲。如果上一页末尾段落未结束(未以句末标点结尾),
  // 保留到这里与下一页开头续接,避免跨页段落被切断。
  let pendingBuffer = "";
  let pendingX: number | null = null; // pending buffer 起始 x(用于缩进比较)

  // 估算正文 typical x(众数),用于检测首行缩进
  let bodyXSamples: number[] = [];

  for (let pageIdx = 1; pageIdx <= totalPages; pageIdx++) {
    const page = await doc.getPage(pageIdx);
    const content = await page.getTextContent();

    // 将 textItem 按 y 坐标分组形成行
    const items: { str: string; x: number; y: number; hasEOL?: boolean }[] = [];
    for (const it of content.items) {
      if (!("str" in it)) continue;
      const ti = it as { str: string; transform: number[]; hasEOL?: boolean };
      items.push({
        str: ti.str,
        x: ti.transform[4],
        y: ti.transform[5],
        hasEOL: ti.hasEOL,
      });
    }

    // 按行聚合
    const lines: TextLine[] = [];
    let currentLine: string[] = [];
    let currentY: number | null = null;
    let currentX = 0;
    let lineStartX = 0;

    for (const it of items) {
      if (currentY === null || Math.abs(it.y - currentY) > 2) {
        if (currentLine.length > 0) {
          lines.push({
            text: currentLine.join(""),
            y: currentY ?? 0,
            x: lineStartX,
          });
        }
        currentLine = [it.str];
        currentY = it.y;
        lineStartX = it.x;
        currentX = it.x;
      } else {
        currentLine.push(it.str);
      }
      if (it.hasEOL) {
        if (currentLine.length > 0) {
          lines.push({
            text: currentLine.join(""),
            y: currentY ?? 0,
            x: lineStartX,
          });
        }
        currentLine = [];
        currentY = null;
      }
    }
    if (currentLine.length > 0) {
      lines.push({
        text: currentLine.join(""),
        y: currentY ?? 0,
        x: lineStartX,
      });
    }

    // 识别页眉页脚:每页顶部与底部 1-2 行通常较短且重复
    const linesOnPage = lines.length;
    const isLikelyHeader = (idx: number) =>
      idx <= 1 && linesOnPage > 4 && (lines[idx]?.text.length ?? 0) < SHORT_LINE_MAX;
    const isLikelyFooter = (idx: number) =>
      idx >= linesOnPage - 2 &&
      linesOnPage > 4 &&
      (lines[idx]?.text.length ?? 0) < SHORT_LINE_MAX;

    // 本页内段落累积缓冲
    let buffer = pendingBuffer;
    let bufferStartX = pendingX;
    // 上一行末尾是否为句末标点(用于判断空行是否为段落分隔)
    let lastLineEndsTerminal = pendingBuffer !== "" && TERMINAL_PUNCT.test(pendingBuffer.trimEnd());
    pendingBuffer = "";
    pendingX = null;

    const flush = (kind: ParagraphKind) => {
      const text = buffer.trim();
      if (text.length === 0) return;
      rawParagraphs.push({
        id: id++,
        text,
        page: pageIdx,
        kind,
      });
      buffer = "";
      bufferStartX = null;
      lastLineEndsTerminal = false;
    };

    // 估算典型 body x:扫描所有非空行后取众数
    if (bodyXSamples.length === 0 && lines.length > 0) {
      for (const ln of lines) {
        const t = ln.text.trim();
        if (t.length > 20) bodyXSamples.push(ln.x);
      }
    }
    const typicalBodyX =
      bodyXSamples.length > 0 ? median(bodyXSamples) : null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const text = line.text.replace(/\s+/g, " ").trim();
      const lineX = line.x;

      if (!text) {
        // 空行:仅当上一行以句末标点结尾时,认为是段落分隔;
        // 若上一行无标点(软换行),空行不分段,继续累积到下一段。
        if (buffer && lastLineEndsTerminal) {
          flush("body");
        }
        continue;
      }

      // 参考文献区一旦开始,后续均为参考文献
      if (referencesStarted) {
        if (rules.skip_references) {
          if (buffer) flush("body");
          buffer = text;
          flush("references");
          lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
          continue;
        }
        buffer += (buffer ? " " : "") + text;
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // 检测参考文献起始
      if (rules.skip_references) {
        if (REFERENCE_KEYWORDS.some((kw) => text.startsWith(kw))) {
          if (buffer) flush("body");
          referencesStarted = true;
          buffer = text;
          flush("references");
          lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
          continue;
        }
      }

      // 版权信息
      if (rules.skip_copyright && COPYRIGHT_KEYWORDS.some((kw) => text.includes(kw))) {
        if (buffer) flush("body");
        buffer = text;
        flush("copyright");
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // 页眉页脚:不打断正文缓冲,直接跳过该行
      if (rules.skip_header_footer && (isLikelyHeader(i) || isLikelyFooter(i))) {
        // 不 flush body,保留缓冲以便跨页眉续接
        continue;
      }

      // 参考文献区一旦开始,后续均为参考文献
      if (referencesStarted) {
        if (rules.skip_references) {
          // 参考文献与正文不混排,直接 flush body 后开始新参考文献段
          if (buffer) flush("body");
          buffer = text;
          flush("references");
          lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
          continue;
        }
        buffer += (buffer ? " " : "") + text;
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // 检测参考文献起始(仅当 buffer 为空 或 上一行已结束)
      if (rules.skip_references && REFERENCE_KEYWORDS.some((kw) => text.startsWith(kw))) {
        if (buffer) flush("body");
        referencesStarted = true;
        buffer = text;
        flush("references");
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // 版权信息:独立段落,不合并
      if (rules.skip_copyright && COPYRIGHT_KEYWORDS.some((kw) => text.includes(kw))) {
        if (buffer) flush("body");
        buffer = text;
        flush("copyright");
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // 目录行:仅在 buffer 为空时识别为目录;否则视为正文续接(可能是误判)
      if (rules.skip_toc && TOC_LINE.test(text) && !buffer) {
        buffer = text;
        flush("toc");
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // 注脚(行首为上标编号):仅当 buffer 为空 或 上一行已结束时识别;
      // 否则视为正文中误识别(如「[1]」出现在句中),按正文处理
      if (
        rules.skip_footnotes &&
        FOOTNOTE_PREFIX.test(text) &&
        (!buffer || lastLineEndsTerminal)
      ) {
        if (buffer) flush("body");
        buffer = text;
        flush("footnote");
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // 注示:同注脚处理
      if (
        rules.skip_annotations &&
        ANNOTATION_PREFIXES.some((p) => text.startsWith(p)) &&
        (!buffer || lastLineEndsTerminal)
      ) {
        if (buffer) flush("body");
        buffer = text;
        flush("annotation");
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // ===== 正文处理 =====
      // 若 buffer 为空,开始新段落
      if (!buffer) {
        bufferStartX = lineX;
        buffer = text;
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
        continue;
      }

      // buffer 非空,根据上一行是否结束判断续接方式
      if (!lastLineEndsTerminal) {
        // 软换行:上一行无句末标点,合并到同段(中文不加空格,英文加空格)
        const lastChar = buffer.slice(-1);
        const firstChar = text[0];
        const isChineseBoundary =
          /[\u4e00-\u9fff]$/.test(lastChar) && /^[\u4e00-\u9fff]/.test(firstChar);
        buffer += isChineseBoundary
          ? text
          : (text.startsWith(" ") ? text : " " + text);
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
      } else {
        // 上一行已结束:判断是否为新段落
        // 1. x 明显不同(标题/居中) → 新段落
        // 2. 有首行缩进 → 新段落
        // 3. 否则:可能是同段不同句,继续累积(让 TTS 按句号切分)
        const isDifferentX =
          typicalBodyX !== null && Math.abs(lineX - typicalBodyX) > 20;
        const hasIndent =
          typicalBodyX !== null && lineX > typicalBodyX + 10;
        if (isDifferentX || hasIndent) {
          flush("body");
          bufferStartX = lineX;
          buffer = text;
        } else {
          // 同段不同句:继续累积(用一个空格分隔,便于 TTS 断句)
          buffer += " " + text;
        }
        lastLineEndsTerminal = TERMINAL_PUNCT.test(text.trimEnd());
      }
    }

    // 页末:不强制 flush body。判断缓冲是否以句末标点结束:
    // - 是 → flush(段落已结束)
    // - 否 → 保留到 pendingBuffer,与下一页续接
    if (buffer) {
      const trimmed = buffer.trimEnd();
      if (TERMINAL_PUNCT.test(trimmed)) {
        flush("body");
      } else {
        // 保留缓冲跨页续接
        pendingBuffer = buffer;
        pendingX = bufferStartX;
        buffer = "";
        bufferStartX = null;
      }
    }

    page.cleanup();
    onProgress?.(pageIdx, totalPages);
  }

  // 文档结束后:flush 残留的 pending buffer
  if (pendingBuffer) {
    const text = pendingBuffer.trim();
    if (text.length > 0) {
      rawParagraphs.push({
        id: id++,
        text,
        page: totalPages,
        kind: "body",
      });
    }
    pendingBuffer = "";
  }

  await doc.destroy();

  // 后处理:合并过短的相邻正文段(< 10 字符,通常是误切)
  const merged = mergeShortParagraphs(rawParagraphs);

  // 统计
  const stats = computeStats(merged);

  return {
    fileName: file.name,
    totalPages,
    paragraphs: merged,
    stats,
  };
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// 合并过短的相邻正文段(可能是解析误切)
function mergeShortParagraphs(paras: Paragraph[]): Paragraph[] {
  const MIN_LEN = 10;
  const result: Paragraph[] = [];
  for (const p of paras) {
    if (
      p.kind === "body" &&
      p.text.length < MIN_LEN &&
      result.length > 0 &&
      result[result.length - 1].kind === "body"
    ) {
      // 合并到上一段
      const prev = result[result.length - 1];
      prev.text = prev.text + " " + p.text;
    } else {
      result.push({ ...p });
    }
  }
  return result;
}

function computeStats(paragraphs: Paragraph[]): ParsedPdf["stats"] {
  const by_kind = {
    body: 0,
    title: 0,
    heading: 0,
    toc: 0,
    footnote: 0,
    annotation: 0,
    header_footer: 0,
    references: 0,
    copyright: 0,
  } as Record<ParagraphKind, number>;

  let readable = 0;
  let skipped = 0;
  for (const p of paragraphs) {
    by_kind[p.kind]++;
    if (p.kind === "body" || p.kind === "heading" || p.kind === "title") {
      readable++;
    } else {
      skipped++;
    }
  }
  return {
    total: paragraphs.length,
    readable,
    skipped,
    by_kind,
  };
}

export function getKindLabel(kind: ParagraphKind): string {
  return KIND_LABELS[kind];
}

export function isReadable(kind: ParagraphKind): boolean {
  return kind === "body" || kind === "heading" || kind === "title";
}

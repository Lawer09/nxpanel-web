import React, { useMemo } from 'react';

type AdsConsoleMarkdownRendererProps = {
  content: string;
  className?: string;
  style?: React.CSSProperties;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderInline = (value: string) => {
  let html = escapeHtml(value);
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_match, alt, url) => {
    return `<img src="${url}" alt="${escapeHtml(alt)}" />`;
  });
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return html;
};

const toHtml = (content: string) => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let inCode = false;
  let inUl = false;
  let inOl = false;
  let codeLines: string[] = [];

  const closeLists = () => {
    if (inUl) {
      output.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      output.push('</ol>');
      inOl = false;
    }
  };

  const flushCode = () => {
    output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    codeLines = [];
  };

  lines.forEach((line) => {
    if (/^```/.test(line.trim())) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        closeLists();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      closeLists();
      return;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closeLists();
      const level = Math.min(heading[1].length, 6);
      output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      return;
    }

    const quote = /^>\s?(.+)$/.exec(trimmed);
    if (quote) {
      closeLists();
      output.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
      return;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    if (unordered) {
      if (inOl) {
        output.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        output.push('<ul>');
        inUl = true;
      }
      output.push(`<li>${renderInline(unordered[1])}</li>`);
      return;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      if (inUl) {
        output.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        output.push('<ol>');
        inOl = true;
      }
      output.push(`<li>${renderInline(ordered[1])}</li>`);
      return;
    }

    closeLists();
    output.push(`<p>${renderInline(trimmed)}</p>`);
  });

  if (inCode) {
    flushCode();
  }
  closeLists();
  return output.join('');
};

const AdsConsoleMarkdownRenderer: React.FC<AdsConsoleMarkdownRendererProps> = ({
  content,
  className,
  style,
}) => {
  const html = useMemo(() => toHtml(content || ''), [content]);

  return (
    <>
      <div
        className={`ads-console-md-rendered ${className || ''}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .ads-console-md-rendered {
          line-height: 1.8;
          font-size: 14px;
          color: #333;
          word-wrap: break-word;
        }
        .ads-console-md-rendered > *:first-child { margin-top: 0 !important; }
        .ads-console-md-rendered > *:last-child { margin-bottom: 0 !important; }
        .ads-console-md-rendered h1 { font-size: 20px; font-weight: 600; margin: 20px 0 10px; }
        .ads-console-md-rendered h2 { font-size: 17px; font-weight: 600; margin: 18px 0 8px; }
        .ads-console-md-rendered h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
        .ads-console-md-rendered h4,
        .ads-console-md-rendered h5,
        .ads-console-md-rendered h6 { font-size: 14px; font-weight: 600; margin: 12px 0 6px; }
        .ads-console-md-rendered p { margin: 6px 0; }
        .ads-console-md-rendered ul { list-style: disc !important; padding-left: 24px !important; margin: 6px 0; }
        .ads-console-md-rendered ol { list-style: decimal !important; padding-left: 24px !important; margin: 6px 0; }
        .ads-console-md-rendered li { margin-bottom: 4px; display: list-item !important; }
        .ads-console-md-rendered code {
          background: #f5f7fa;
          color: #476582;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .ads-console-md-rendered pre {
          background: #f5f7fa;
          padding: 14px 18px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 10px 0;
          border: 1px solid #eef0f4;
        }
        .ads-console-md-rendered pre code {
          background: none;
          padding: 0;
          color: #333;
        }
        .ads-console-md-rendered blockquote {
          border-left: 4px solid #d0d7de;
          padding: 4px 16px;
          color: #656d76;
          margin: 10px 0;
          background: #f8f9fa;
          border-radius: 0 6px 6px 0;
        }
        .ads-console-md-rendered img {
          max-width: 100%;
          border-radius: 8px;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .ads-console-md-rendered a { color: #1677ff; text-decoration: none; }
        .ads-console-md-rendered a:hover { text-decoration: underline; }
        .ads-console-md-rendered strong { font-weight: 600; }
        .ads-console-md-rendered del { color: #999; }
      `}</style>
    </>
  );
};

export default AdsConsoleMarkdownRenderer;

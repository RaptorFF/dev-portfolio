import { useLayoutEffect, useRef, useState } from "react";

const CV_RICH_TEXT_TAGS = new Set([
  "B",
  "BR",
  "DIV",
  "EM",
  "FONT",
  "I",
  "LI",
  "OL",
  "P",
  "SPAN",
  "STRONG",
  "U",
  "UL",
]);
const CV_FONT_FAMILIES = new Set([
  "Arial",
  "Georgia",
  "Tahoma",
  "Times New Roman",
  "Verdana",
]);
const CV_FONT_SIZES = {
  1: "12px",
  2: "14px",
  3: "16px",
  4: "18px",
  5: "24px",
};

function getCvColorInputValue(color) {
  const channels = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color);
  if (!channels) return "#000000";
  return `#${channels
    .slice(1)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function sanitizeCvRichText(value) {
  if (typeof window === "undefined") return "";

  const source = String(value || "");
  const parser = new DOMParser();
  const parsed = parser.parseFromString(source, "text/html");
  const output = document.createElement("div");

  function copyNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent || ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "IFRAME") return;
    if (!CV_RICH_TEXT_TAGS.has(tag)) {
      Array.from(node.childNodes).forEach((child) => copyNode(child, parent));
      return;
    }

    const cleanTag = tag === "FONT" ? "SPAN" : tag.toLowerCase();
    const cleanNode = document.createElement(cleanTag);
    if (tag === "FONT") {
      const family = node.getAttribute("face");
      const size = CV_FONT_SIZES[node.getAttribute("size")];
      const color = node.getAttribute("color");
      if (family && CV_FONT_FAMILIES.has(family)) {
        cleanNode.style.fontFamily = family;
      }
      if (size) cleanNode.style.fontSize = size;
      if (color && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color)) {
        cleanNode.style.color = color;
      }
    }

    const styles = node.style;
    if (styles) {
      const color = styles.color;
      const fontSize = styles.fontSize;
      const fontFamily = styles.fontFamily.replaceAll('"', "").split(",")[0].trim();
      if (color && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color)) {
        cleanNode.style.color = color;
      }
      if (/^(?:12|14|16|18|24)px$/.test(fontSize)) {
        cleanNode.style.fontSize = fontSize;
      }
      if (CV_FONT_FAMILIES.has(fontFamily)) {
        cleanNode.style.fontFamily = fontFamily;
      }
    }

    Array.from(node.childNodes).forEach((child) =>
      copyNode(child, cleanNode),
    );
    parent.append(cleanNode);
  }

  Array.from(parsed.body.childNodes).forEach((child) =>
    copyNode(child, output),
  );

  return output.innerHTML;
}

function prepareCvRichText(value, bulletList) {
  const source = typeof value === "string" ? value : "";
  if (typeof document === "undefined") return source;
  const hasSupportedMarkup =
    /<\/?(?:b|br|div|em|font|i|li|ol|p|span|strong|u|ul)\b/i.test(source);

  if (bulletList && source && !hasSupportedMarkup) {
    const list = document.createElement("ul");
    source.split(/\r?\n/).forEach((line) => {
      const item = document.createElement("li");
      item.textContent = line.replace(/^\s*•\s?/, "");
      list.append(item);
    });
    return sanitizeCvRichText(list.outerHTML);
  }

  return sanitizeCvRichText(source);
}

function CvRichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  bulletList = false,
}) {
  const editorRef = useRef(null);
  const printRef = useRef(null);
  const savedSelection = useRef(null);
  const toolbarFrame = useRef(null);
  const [active, setActive] = useState(false);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [placeholderSuppressed, setPlaceholderSuppressed] = useState(false);
  const [formatState, setFormatState] = useState({});
  const [plainTextMode, setPlainTextMode] = useState(false);
  const safeValue = prepareCvRichText(
    value,
    bulletList && !plainTextMode,
  );
  const emptyContent =
    bulletList && !plainTextMode ? "<ul><li><br></li></ul>" : "";

  function showToolbar() {
    if (toolbarFrame.current !== null) {
      window.cancelAnimationFrame(toolbarFrame.current);
    }
    toolbarFrame.current = window.requestAnimationFrame(() => {
      toolbarFrame.current = null;
      setActive(true);
      updateFormatState();
    });
  }

  function hideToolbar() {
    if (toolbarFrame.current !== null) {
      window.cancelAnimationFrame(toolbarFrame.current);
      toolbarFrame.current = null;
    }
    setActive(false);
  }

  function updateFormatState() {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!editor) return;
    const selectionInEditor =
      selection?.rangeCount && editor?.contains(selection.anchorNode);
    const anchorNode = selectionInEditor ? selection.anchorNode : editor;
    const anchorElement =
      anchorNode?.nodeType === Node.ELEMENT_NODE
        ? anchorNode
        : anchorNode?.parentElement;
    const currentFontSize = window.getComputedStyle(
      anchorElement || editor,
    ).fontSize;
    const fontSize =
      Object.entries(CV_FONT_SIZES).find(
        ([, value]) => value === currentFontSize,
      )?.[0] || "";
    const color = getCvColorInputValue(
      window.getComputedStyle(anchorElement || editor).color,
    );

    setFormatState({
      bold: Boolean(selectionInEditor && document.queryCommandState("bold")),
      italic: Boolean(selectionInEditor && document.queryCommandState("italic")),
      underline: Boolean(
        selectionInEditor && document.queryCommandState("underline"),
      ),
      insertUnorderedList: Boolean(
        selectionInEditor && document.queryCommandState("insertUnorderedList"),
      ),
      fontSize,
      fontSizePx: currentFontSize,
      color,
    });
  }

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (
      sanitizeCvRichText(editor.innerHTML) !== safeValue ||
      (bulletList && !plainTextMode && !safeValue && !editor.innerHTML)
    ) {
      editor.innerHTML = safeValue || emptyContent;
    }
    setPlaceholderVisible(
      !editor.textContent?.trim() && !placeholderSuppressed,
    );
    if (printRef.current) printRef.current.innerHTML = safeValue;
  }, [
    bulletList,
    emptyContent,
    plainTextMode,
    placeholderSuppressed,
    safeValue,
  ]);

  useLayoutEffect(
    () => () => {
      if (toolbarFrame.current !== null) {
        window.cancelAnimationFrame(toolbarFrame.current);
      }
    },
    [],
  );

  function saveSelection() {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (
      selection?.rangeCount &&
      editor?.contains(selection.getRangeAt(0).commonAncestorContainer)
    ) {
      savedSelection.current = selection.getRangeAt(0).cloneRange();
      updateFormatState();
    }
  }

  function restoreSelection() {
    const selection = window.getSelection();
    if (!selection || !savedSelection.current) return;
    selection.removeAllRanges();
    selection.addRange(savedSelection.current);
  }

  function applyCommand(command, commandValue) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, commandValue);
    if (command === "insertUnorderedList") {
      const listActive = document.queryCommandState(command);
      setPlaceholderSuppressed(listActive);
      if (bulletList) setPlainTextMode(!listActive);
    }
    saveSelection();
    onChange(sanitizeCvRichText(editorRef.current?.innerHTML));
  }

  function handleInput() {
    setPlaceholderSuppressed(false);
    setPlaceholderVisible(
      !editorRef.current?.textContent?.trim(),
    );
    saveSelection();
    onChange(sanitizeCvRichText(editorRef.current?.innerHTML));
  }

  function insertPlainText(event) {
    if (!event.clipboardData) return;
    event.preventDefault();
    document.execCommand(
      "insertText",
      false,
      event.clipboardData.getData("text/plain"),
    );
    handleInput();
  }

  const toolbarProps = {
    onMouseDown: (event) => {
      saveSelection();
      if (
        event.target.tagName !== "SELECT" &&
        event.target.tagName !== "INPUT"
      ) {
        event.preventDefault();
      }
    },
  };

  return (
    <div
      className={`cv-rich-text ${bulletList ? "cv-rich-text-bullets" : ""}`}
      onFocusCapture={showToolbar}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          hideToolbar();
          if (editorRef.current) {
            editorRef.current.innerHTML =
              prepareCvRichText(
                editorRef.current.innerHTML,
                bulletList && !plainTextMode,
              ) ||
              emptyContent;
          }
        }
      }}
    >
      {active ? (
        <div
          {...toolbarProps}
          className="cv-rich-text-toolbar"
          role="toolbar"
          aria-label={`${label} formatting`}
        >
          <label>
            <span className="cv-rich-text-visually-hidden">Font</span>
            <select
              aria-label="Font"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) {
                  applyCommand("fontName", event.target.value);
                  event.target.value = "";
                }
              }}
            >
              <option value="">Font</option>
              {[...CV_FONT_FAMILIES].map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="cv-rich-text-visually-hidden">Font size</span>
            <select
              aria-label="Font size"
              defaultValue=""
              onChange={(event) => {
                const size = event.target.value;
                if (size) {
                  applyCommand("fontSize", size);
                  event.target.value = "";
                }
              }}
            >
              <option value="">Size</option>
              {formatState.fontSizePx &&
              !Object.values(CV_FONT_SIZES).includes(formatState.fontSizePx) ? (
                <option value="current" disabled>
                  ✓ {formatState.fontSizePx}
                </option>
              ) : null}
              {[
                ["1", "12"],
                ["2", "14"],
                ["3", "16"],
                ["4", "18"],
                ["5", "24"],
              ].map(([value, labelValue]) => (
                <option key={value} value={value}>
                  {formatState.fontSize === value
                    ? `✓ ${labelValue}px`
                    : `${labelValue}px`}
                </option>
              ))}
            </select>
          </label>
          {[
            ["bold", "Bold", "B"],
            ["italic", "Italic", "I"],
            ["underline", "Underline", "U"],
            ["insertUnorderedList", "Bulleted list", "• List"],
          ].map(([command, labelValue, text]) => (
            <button
              key={command}
              type="button"
              aria-label={labelValue}
              aria-pressed={formatState[command] || false}
              title={labelValue}
              onClick={() => applyCommand(command)}
            >
              {command === "bold" ? (
                <strong>{text}</strong>
              ) : command === "italic" ? (
                <em>{text}</em>
              ) : command === "underline" ? (
                <u>{text}</u>
              ) : (
                text
              )}
            </button>
          ))}
          <label className="cv-rich-text-color">
            <span>Text color</span>
            <input
              type="color"
              aria-label="Text color"
              value={formatState.color || "#000000"}
              onChange={(event) => applyCommand("foreColor", event.target.value)}
            />
          </label>
        </div>
      ) : null}
      <div
        ref={editorRef}
        className={`cv-inline-field cv-inline-multiline-field ${className}`}
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        data-placeholder-visible={placeholderVisible}
        onInput={handleInput}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={insertPlainText}
      />
      <div
        ref={printRef}
        className="cv-inline-field cv-inline-print-value"
        aria-hidden="true"
      />
    </div>
  );
}

export function CvStarRating({ level, label, onChange }) {
  return (
    <div className="cv-star-rating" role="group" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) =>
        onChange ? (
          <button
            className={star <= level ? "active" : ""}
            type="button"
            key={star}
            aria-label={`${star} of 5 stars`}
            aria-pressed={star === level}
            onClick={() => onChange(star)}
          >
            {star <= level ? "★" : "☆"}
          </button>
        ) : (
          <span
            className={star <= level ? "active" : ""}
            key={star}
            aria-hidden="true"
          >
            {star <= level ? "★" : "☆"}
          </span>
        ),
      )}
    </div>
  );
}

export function CvInlineField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  multiline = false,
  wrap = false,
}) {
  const fieldProps = {
    className: `cv-inline-field ${className}`,
    "aria-label": label,
    value,
    onChange: (event) => onChange(event.target.value),
    placeholder,
  };

  return multiline ? (
    <CvRichTextEditor
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  ) : wrap ? (
    <CvInlineWrappedField
      {...fieldProps}
      value={value}
      onChange={onChange}
    />
  ) : (
    <input {...fieldProps} />
  );
}

function CvInlineWrappedField({
  className,
  label,
  value,
  onChange,
  placeholder,
}) {
  const fieldRef = useRef(null);

  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [value]);

  return (
    <>
      <textarea
        ref={fieldRef}
        className={`cv-inline-wrapped-field ${className}`}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={1}
        wrap="soft"
      />
      <div
        className={`cv-inline-field cv-inline-print-value ${className}`}
        aria-hidden="true"
      >
        {value}
      </div>
    </>
  );
}

const CV_MONTH_PREFIXES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const CV_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function parseCvMonth(value) {
  const date = typeof value === "string" ? value.trim() : "";
  let match = /^(\d{4})-(\d{1,2})$/.exec(date);

  if (match) {
    const month = Number(match[2]);
    return month >= 1 && month <= 12
      ? { year: Number(match[1]), month }
      : null;
  }

  match = /^(\d{1,2})[/. -]+(\d{4})$/.exec(date);
  if (match) {
    const month = Number(match[1]);
    return month >= 1 && month <= 12
      ? { year: Number(match[2]), month }
      : null;
  }

  match = /^([a-z]+)[\s,./-]+(\d{4})$/i.exec(date);
  if (!match) return null;

  const month = CV_MONTH_PREFIXES.indexOf(match[1].slice(0, 3).toLowerCase());
  return month >= 0 ? { year: Number(match[2]), month: month + 1 } : null;
}

function formatCvMonth(value) {
  const date = parseCvMonth(value);
  return date
    ? CV_MONTH_FORMATTER.format(new Date(Date.UTC(date.year, date.month - 1, 1)))
    : value;
}

function CvMonthDateField({ label, value, onChange, placeholder }) {
  const date = parseCvMonth(value);
  const inputValue = date
    ? `${date.year}-${String(date.month).padStart(2, "0")}`
    : "";
  const displayValue = typeof value === "string" ? value.trim() : "";

  return (
    <span className={`cv-date-field ${displayValue ? "" : "cv-date-empty"}`}>
      <span
        className={`cv-date-value ${
          displayValue ? "" : "cv-date-placeholder"
        }`}
        aria-hidden="true"
      >
        {displayValue ? formatCvMonth(displayValue) : placeholder}
      </span>
      <input
        className="cv-date-month-input"
        type="month"
        aria-label={label}
        value={inputValue}
        onClick={(event) => event.currentTarget.showPicker?.()}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

export function CvDateRange({
  className = "",
  startLabel,
  startValue,
  onStartChange,
  endLabel,
  endValue,
  onEndChange,
}) {
  const previousEndValue = useRef("");
  const isPresent =
    typeof endValue === "string" && endValue.trim().toLowerCase() === "present";

  return (
    <div className={`cv-document-dates ${className}`}>
      <CvMonthDateField
        label={startLabel}
        value={startValue}
        onChange={onStartChange}
        placeholder="From"
      />
      <span className="cv-date-separator" aria-hidden="true">
        –
      </span>
      {isPresent ? null : (
        <CvMonthDateField
          label={endLabel}
          value={endValue}
          onChange={(value) => {
            previousEndValue.current = value;
            onEndChange(value);
          }}
          placeholder="To"
        />
      )}
      <label className="cv-date-current-toggle">
        <input
          type="checkbox"
          checked={isPresent}
          onChange={(event) => {
            if (event.target.checked) {
              previousEndValue.current = endValue || "";
              onEndChange("Present");
            } else {
              onEndChange(previousEndValue.current);
            }
          }}
        />
        <span>Present</span>
      </label>
      {isPresent ? (
        <span className="cv-date-present-print">Present</span>
      ) : null}
    </div>
  );
}

export function CvBulletListField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}) {
  return (
    <div className={`cv-document-role-details ${className}`}>
      <CvRichTextEditor
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="cv-inline-description"
        bulletList
      />
    </div>
  );
}

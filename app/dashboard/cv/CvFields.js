import { useLayoutEffect, useRef } from "react";

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
}) {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    if (!multiline || !textareaRef.current) return;

    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [multiline, value]);

  const fieldProps = {
    className: `cv-inline-field ${className}`,
    "aria-label": label,
    value,
    onChange: (event) => onChange(event.target.value),
    placeholder,
  };

  return multiline ? (
    <>
      <textarea
        {...fieldProps}
        className={`${fieldProps.className} cv-inline-multiline-field`}
        ref={textareaRef}
        rows={1}
      />
      <div
        className={`${fieldProps.className} cv-inline-print-value`}
        aria-hidden="true"
        style={{ display: "none" }}
      >
        {value}
      </div>
    </>
  ) : (
    <input {...fieldProps} />
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
    <span className="cv-date-field">
      <span
        className={`cv-date-value ${
          displayValue ? "" : "cv-date-placeholder"
        }`}
        aria-hidden="true"
      >
        {displayValue ? formatCvMonth(displayValue) : placeholder}
      </span>
      <svg
        className="cv-date-calendar"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
      <input
        className="cv-date-month-input"
        type="month"
        aria-label={label}
        value={inputValue}
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
      <span aria-hidden="true">–</span>
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
  const textareaRefs = useRef([]);
  const pendingFocus = useRef(null);
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*•\s?/, ""));

  useLayoutEffect(() => {
    textareaRefs.current.forEach((textarea) => {
      if (!textarea) return;
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    });

    if (pendingFocus.current) {
      const { index, position } = pendingFocus.current;
      const textarea = textareaRefs.current[index];
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(position, position);
      }
      pendingFocus.current = null;
    }
  }, [value]);

  function updateLines(nextLines, focus) {
    pendingFocus.current = focus || null;
    onChange(nextLines.join("\n"));
  }

  return (
    <div className={`cv-document-role-details ${className}`}>
      {lines.map((line, index) => (
        <div className="cv-document-role-line" key={index}>
          <span className="cv-document-role-bullet" aria-hidden="true" />
          <textarea
            ref={(textarea) => {
              textareaRefs.current[index] = textarea;
            }}
            className="cv-inline-field cv-inline-description cv-role-detail-line"
            aria-label={`${label}, item ${index + 1}`}
            placeholder={index === 0 ? placeholder : ""}
            value={line}
            rows={1}
            onChange={(event) => {
              const nextLines = [...lines];
              nextLines[index] = event.target.value;
              updateLines(nextLines);
            }}
            onKeyDown={(event) => {
              const textarea = event.currentTarget;
              if (event.key === "Enter") {
                event.preventDefault();
                const before = line.slice(0, textarea.selectionStart);
                const after = line.slice(textarea.selectionEnd);
                const nextLines = [...lines];
                nextLines.splice(index, 1, before, after);
                updateLines(nextLines, { index: index + 1, position: 0 });
              } else if (
                event.key === "Backspace" &&
                index > 0 &&
                textarea.selectionStart === 0 &&
                textarea.selectionEnd === 0
              ) {
                event.preventDefault();
                const previousLine = lines[index - 1];
                const nextLines = [...lines];
                nextLines.splice(index - 1, 2, previousLine + line);
                updateLines(nextLines, {
                  index: index - 1,
                  position: previousLine.length,
                });
              } else if (
                event.key === "Delete" &&
                index < lines.length - 1 &&
                textarea.selectionStart === line.length &&
                textarea.selectionEnd === line.length
              ) {
                event.preventDefault();
                const nextLines = [...lines];
                nextLines.splice(index, 2, line + lines[index + 1]);
                updateLines(nextLines, { index, position: line.length });
              }
            }}
          />
          <div
            className="cv-inline-field cv-inline-description cv-role-detail-line cv-role-detail-print-value"
            aria-hidden="true"
            style={{ display: "none" }}
          >
            {line}
          </div>
        </div>
      ))}
    </div>
  );
}

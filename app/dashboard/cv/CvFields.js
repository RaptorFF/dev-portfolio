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
    <textarea {...fieldProps} ref={textareaRef} rows={1} />
  ) : (
    <input {...fieldProps} />
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
        </div>
      ))}
    </div>
  );
}

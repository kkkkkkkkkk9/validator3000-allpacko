"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useComments } from "@/hooks/use-comments";

type CommentsPanelProps = {
  screenId: string;
  orgId: string;
  screenName: string;
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const month = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${month} ${time}`;
}

export function CommentsPanel({ screenId, orgId, screenName }: CommentsPanelProps) {
  const { comments, loading, submitComment, deleteComment } = useComments(screenId, orgId);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit() {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    await submitComment(body);
    setBody("");
    setSubmitting(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Show newest first
  const sorted = [...comments].reverse();

  return (
    <div
      style={{
        width: 280,
        background: "#0a0a0a",
        border: "1px solid #222",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "inherit",
        maxHeight: "80vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          color: "#555",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 2,
          padding: "20px 16px 16px",
          borderBottom: "1px solid #222",
        }}
      >
        Comments
      </div>

      {/* Screen label */}
      <div
        style={{
          color: "#888",
          fontSize: 11,
          padding: "12px 16px 0",
        }}
      >
        <span style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Screen:{" "}
        </span>
        {screenName}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #222",
        }}
      >
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's working? What isn't?"
          style={{
            width: "100%",
            background: "none",
            border: "1px solid #333",
            color: "#ccc",
            fontFamily: "inherit",
            fontSize: 12,
            padding: 10,
            resize: "none",
            outline: "none",
            height: 72,
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !body.trim()}
          style={{
            width: "100%",
            marginTop: 8,
            border: "1px solid #444",
            background: "none",
            color: submitting ? "#333" : "#888",
            fontFamily: "inherit",
            fontSize: 11,
            padding: 8,
            cursor: submitting ? "default" : "pointer",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      {/* Comment list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 0",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "8px 16px",
              color: "#333",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            Loading...
          </div>
        ) : sorted.length === 0 ? (
          <div
            style={{
              padding: "8px 16px",
              color: "#333",
              fontSize: 10,
              textAlign: "center",
            }}
          >
            No comments yet
          </div>
        ) : (
          sorted.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid #151515",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ color: "#888", fontSize: 11 }}>
                  {comment.profiles?.display_name ?? "Anonymous"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#333", fontSize: 10 }}>
                    {formatTimestamp(comment.created_at)}
                  </span>
                  <button
                    onClick={() => deleteComment(comment.id)}
                    title="Delete comment"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#333",
                      fontSize: 10,
                      cursor: "pointer",
                      padding: 0,
                      fontFamily: "inherit",
                    }}
                  >
                    x
                  </button>
                </div>
              </div>
              <div
                style={{
                  color: "#aaa",
                  fontSize: 12,
                  lineHeight: 1.5,
                  wordWrap: "break-word",
                }}
              >
                {comment.body}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

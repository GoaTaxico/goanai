import type { ReactNode } from "react";

import type { Copy } from "@/lib/copy";

type MessageActionsProps = {
  copy: Copy;
  mine: boolean;
  copied: boolean;
  speaking: boolean;
  canEdit: boolean;
  canRetry: boolean;
  downloadUrl?: string;
  noted?: boolean;
  onCopy: () => void;
  onWhatsApp: () => void;
  onListen: () => void;
  onRetry: () => void;
  onEdit: () => void;
  onNote?: () => void;
};

function Action({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`tide-action${active ? " is-on" : ""}`}
    >
      {children}
    </button>
  );
}

export function MessageActions({
  copy,
  mine,
  copied,
  speaking,
  canEdit,
  canRetry,
  downloadUrl,
  noted,
  onCopy,
  onWhatsApp,
  onListen,
  onRetry,
  onEdit,
  onNote,
}: MessageActionsProps) {
  return (
    <div className="tide-actions" role="group">
      <Action label={copied ? copy.copied : copy.copy} active={copied} onClick={onCopy}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Action>
      {canEdit ? (
        <Action label={copy.edit} onClick={onEdit}>
          <EditIcon />
        </Action>
      ) : null}
      {mine ? null : (
        <Action label={copy.whatsapp} onClick={onWhatsApp}>
          <WhatsAppIcon />
        </Action>
      )}
      {mine ? null : (
        <Action label={speaking ? copy.listenStop : copy.listen} active={speaking} onClick={onListen}>
          {speaking ? <StopIcon /> : <ListenIcon />}
        </Action>
      )}
      {canRetry ? (
        <Action label={copy.regenerate} onClick={onRetry}>
          <RetryIcon />
        </Action>
      ) : null}
      {downloadUrl ? (
        <a
          href={downloadUrl}
          download="susegad.png"
          aria-label={copy.download}
          title={copy.download}
          className="tide-action"
        >
          <DownloadIcon />
        </a>
      ) : null}
      {onNote ? (
        <Action label={noted ? copy.noteSaved : copy.note} active={noted} onClick={onNote}>
          <NoteIcon />
        </Action>
      ) : null}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M10 3.5v9M6.5 9.5L10 13l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 16.5h11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M6 3.5h8a1.5 1.5 0 0 1 1.5 1.5v11l-2.5-1.4L10.5 16l-2.5-1.4L5.5 16V5A1.5 1.5 0 0 1 7 3.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 13H4.5A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5V5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M12.2 4.2l3.6 3.6L7.4 16.2 3.5 16.5l.3-3.9 8.4-8.4z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M10 3.2a6.3 6.3 0 0 0-5.4 9.5L3.6 16.4l3.8-1A6.3 6.3 0 1 0 10 3.2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 8.2c.2 1.2 1.5 2.6 2.7 3 .4.1.8 0 1.1-.3l.5-.6c.2-.2.1-.4 0-.6l-.7-.4c-.2-.1-.4 0-.5.2l-.2.3c-.3-.2-.8-.6-1.1-1l-.3-.3.3-.3c.2-.2.2-.4.1-.6l-.4-.7c-.1-.2-.4-.2-.6 0l-.5.5c-.3.3-.4.7-.4 1.2z" fill="currentColor" />
    </svg>
  );
}

function ListenIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M4 8.2v3.6M7.2 6.2v7.6M10.4 4.2v11.6M13.6 6.8v6.4M16.2 8.6v2.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <rect x="6" y="6" width="8" height="8" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M15.5 8.2A5.5 5.5 0 1 0 14 13.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M15.6 4.8v3.6H12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

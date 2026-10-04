import { useEffect, useId } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { AlertCircle, CheckCircle2, Inbox, Loader2, X } from 'lucide-react';

function cx(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' '); }

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode;
}
export function Button({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  return <button className={cx('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)} disabled={disabled || loading} {...props}>
    {loading ? <Loader2 className="ui-spin" size={17} aria-hidden /> : icon}<span>{children}</span>
  </button>;
}

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'admin' | 'superadmin';
export function Badge({ variant = 'neutral', pulse, children, className }: { variant?: BadgeVariant; pulse?: boolean; children: ReactNode; className?: string }) {
  return <span className={cx('ui-badge', `ui-badge--${variant}`, className)}>{pulse && <span className="ui-badge__dot" />}{children}</span>;
}

export function Card({ children, className, interactive, onClick }: { children: ReactNode; className?: string; interactive?: boolean; onClick?: () => void }) {
  return <div className={cx('ui-card', interactive && 'ui-card--interactive', className)} onClick={onClick}>{children}</div>;
}

export function Tile({ icon, eyebrow, title, description, action, badge }: { icon?: ReactNode; eyebrow?: string; title: string; description?: string; action?: ReactNode; badge?: ReactNode }) {
  return <Card className="ui-tile" interactive={Boolean(action)}><div className="ui-tile__top"><span className="ui-tile__icon">{icon}</span>{badge}</div>{eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}<h3>{title}</h3>{description && <p className="ui-muted">{description}</p>}{action && <div className="ui-tile__action">{action}</div>}</Card>;
}

interface FieldProps { label?: string; error?: string; hint?: string }
export function Input({ label, error, hint, className, id, ...props }: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const generated = useId(); const inputId = id ?? generated;
  return <label className="ui-field" htmlFor={inputId}>{label && <span className="ui-label">{label}</span>}<input id={inputId} className={cx('ui-input', error && 'ui-input--error', className)} aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${inputId}-help` : undefined} {...props} />{(error || hint) && <span id={`${inputId}-help`} className={cx('ui-help', error && 'ui-help--error')}>{error ?? hint}</span>}</label>;
}
export function Textarea({ label, error, hint, className, id, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const generated = useId(); const inputId = id ?? generated;
  return <label className="ui-field" htmlFor={inputId}>{label && <span className="ui-label">{label}</span>}<textarea id={inputId} className={cx('ui-input', 'ui-textarea', error && 'ui-input--error', className)} aria-invalid={Boolean(error)} {...props} />{(error || hint) && <span className={cx('ui-help', error && 'ui-help--error')}>{error ?? hint}</span>}</label>;
}
export function Select({ label, children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return <label className="ui-field">{label && <span className="ui-label">{label}</span>}<select className={cx('ui-input', className)} {...props}>{children}</select></label>;
}

export function Alert({ variant = 'info', title, children, onDismiss }: { variant?: 'info' | 'success' | 'warning' | 'danger'; title?: string; children: ReactNode; onDismiss?: () => void }) {
  return <div className={cx('ui-alert', `ui-alert--${variant}`)} role={variant === 'danger' ? 'alert' : 'status'}>{variant === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}<div><strong>{title}</strong><div>{children}</div></div>{onDismiss && <button aria-label="Dismiss" onClick={onDismiss}><X size={16} /></button>}</div>;
}
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const percent = Math.max(0, Math.min(100, value));
  return <div className="ui-progress-wrap">{label && <div className="ui-progress-label"><span>{label}</span><span>{Math.round(percent)}%</span></div>}<div className="ui-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: `${percent}%` }} /></div></div>;
}
export function LoadingState({ label = 'Loading…' }: { label?: string }) { return <div className="ui-state"><Loader2 className="ui-spin" size={28} /><p>{label}</p></div>; }
export function EmptyState({ title = 'Nothing here yet', description, action }: { title?: string; description?: string; action?: ReactNode }) { return <div className="ui-state"><Inbox size={34} /><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>; }
export function ErrorState({ title = 'Something went wrong', error, onRetry }: { title?: string; error?: unknown; onRetry?: () => void }) { const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined; return <div className="ui-state ui-state--error"><AlertCircle size={34} /><h3>{title}</h3>{detail && <p>{detail}</p>}{onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}</div>; }

export function Modal({ open, title, children, onClose, footer }: { open: boolean; title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  useEffect(() => { if (!open) return; const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, [open, onClose]);
  if (!open) return null;
  return <div className="ui-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="ui-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button onClick={onClose} aria-label="Close"><X size={19} /></button></header><div className="ui-modal__body">{children}</div>{footer && <footer>{footer}</footer>}</section></div>;
}

export function StatCard({ label, value, change, icon }: { label: string; value: string | number; change?: string; icon?: ReactNode }) { return <Card className="ui-stat"><div><p className="ui-muted">{label}</p><strong>{value}</strong>{change && <small>{change}</small>}</div><span>{icon}</span></Card>; }
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) { return <header className="ui-page-header"><div>{eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="ui-actions">{actions}</div>}</header>; }
export function DataTable({ columns, rows, empty }: { columns: Array<{ key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }>; rows: Array<Record<string, unknown>>; empty?: ReactNode }) { if (!rows.length) return <>{empty ?? <EmptyState />}</>; return <div className="ui-table-wrap"><table className="ui-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{columns.map((column) => <td key={column.key} data-label={column.label}>{column.render ? column.render(row) : String(row[column.key] ?? '')}</td>)}</tr>)}</tbody></table></div>; }

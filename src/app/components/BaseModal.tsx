"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./BaseModal.module.css";

type BaseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
}: BaseModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 id={titleId}>{title}</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            Close
          </button>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </dialog>
  );
}
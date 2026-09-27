"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AttachmentButtonProps {
  canAttach: boolean;
  isUploading?: boolean;
  onPick: (file: File) => void;
  onBlocked: () => void;
}

export function AttachmentButton({
  canAttach,
  isUploading = false,
  onPick,
  onBlocked,
}: AttachmentButtonProps): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function handleClick(): void {
    if (!canAttach) {
      onBlocked();
      return;
    }
    inputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;
    if (!canAttach) {
      onBlocked();
      return;
    }
    onPick(file);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Attach image"
        aria-disabled={!canAttach}
        onClick={handleClick}
      >
        <ImagePlus aria-hidden="true" />
        {isUploading ? "Uploading." : "Attach"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-hidden="true"
        tabIndex={-1}
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}

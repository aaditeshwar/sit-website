import { useEffect, useRef } from 'react'
import { ResponsiveImage } from './ResponsiveImage'

export function Lightbox({
  open,
  onClose,
  src,
  alt,
}: {
  open: boolean
  onClose: () => void
  src?: string
  alt: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog ref={ref} className="lightbox" onClose={onClose}>
      <div className="flex flex-col items-end gap-3">
        <button type="button" className="rounded-md bg-surface px-3 py-2 text-sm text-ink" onClick={onClose}>
          Close
        </button>
        <ResponsiveImage
          src={src}
          alt={alt}
          seed={src || alt || 'image'}
          className="max-h-[80vh] w-auto max-w-full rounded-md"
          sizes="90vw"
        />
      </div>
    </dialog>
  )
}

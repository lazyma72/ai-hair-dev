type Props = {
  text: string;
  accept?: string;
  disabled?: boolean;
  className?: string;
  onSelect: (file: File) => void;
};

export default function FileUploadButton({
  text,
  accept,
  disabled = false,
  className = "rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800",
  onSelect,
}: Props) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center ${className}${disabled ? " cursor-not-allowed opacity-60" : ""}`}
    >
      {text}
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onSelect(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

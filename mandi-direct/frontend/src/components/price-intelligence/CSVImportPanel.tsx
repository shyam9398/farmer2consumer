import React, { useState } from "react";
import { CSVImportResponse } from "@/types/priceIntelligence";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from "lucide-react";

interface CSVImportPanelProps {
  onUpload: (file: File) => Promise<CSVImportResponse>;
  onClose: () => void;
}

export const CSVImportPanel: React.FC<CSVImportPanelProps> = ({ onUpload, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<CSVImportResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const res = await onUpload(file);
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "CSV import failed. Please verify file format.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-lg text-foreground">Bulk Import Price Observations (CSV)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground mb-1">Expected CSV Header Format:</p>
            <code className="block p-2 rounded bg-background border border-border font-mono text-[11px] overflow-x-auto text-foreground">
              product_name,category,variety,quality_grade,price,price_unit,market_name,district,state,source_type,source_name,observation_date
            </code>
            <p className="mt-2 text-[11px]">
              Example date format: <code>YYYY-MM-DD</code> (e.g. <code>2026-09-10</code>). Price units: <code>PER_KG</code>, <code>PER_QUINTAL</code>, <code>PER_TON</code>.
            </p>
          </div>

          <div className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              {file ? file.name : "Select or drag & drop a .csv file"}
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-3 text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 cursor-pointer"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="space-y-3 p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Imported: {result.imported_count} / {result.total_rows}
                </span>
                {result.error_count > 0 && (
                  <span className="flex items-center gap-1 text-rose-500">
                    <AlertTriangle className="h-4 w-4" />
                    Failed Rows: {result.error_count}
                  </span>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-2 bg-muted/20 text-[11px] space-y-1">
                  <p className="font-bold text-rose-600">Validation Errors:</p>
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="text-rose-500">
                      Row {err.row_number}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium text-xs"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              {isUploading ? "Importing CSV..." : "Upload & Validate CSV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

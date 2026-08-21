import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { Download, CheckCircle, AlertCircle, FileSpreadsheet, X } from 'lucide-react'
import api from '@/services/api'
import Button from '@/components/ui/Button'
import Card, { CardContent } from '@/components/ui/Card'
import PageHeader from '@/components/ui/PageHeader'

interface ValidatedRow {
  row: number
  category: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  marks: string | number
  errors: string[]
}

interface ValidateResponse {
  total_rows: number
  valid_count: number
  invalid_count: number
  rows: ValidatedRow[]
}

interface ImportResponse {
  imported: number
  failed: number
  errors: { row: number; error: string }[]
}

export default function BulkUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ValidateResponse | null>(null)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const validateMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await api.post('/questions/validate-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data as ValidateResponse
    },
    onSuccess: (data) => {
      setPreview(data)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (rows: ValidatedRow[]) => {
      const validRows = rows.filter((r) => r.errors.length === 0)
      const response = await api.post('/questions/bulk-import', { rows: validRows })
      return response.data as ImportResponse
    },
    onSuccess: (data) => {
      setImportResult(data)
    },
  })

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setPreview(null)
    setImportResult(null)
    validateMutation.mutate(selectedFile)
  }, [validateMutation])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFile(droppedFile)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }, [handleFile])

  const downloadSample = async () => {
    const response = await api.get('/questions/sample-download', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'sample-mcq-upload.xlsx')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validRows = preview?.rows.filter((r) => r.errors.length === 0) ?? []

  return (
    <div>
      <PageHeader
        title="Bulk Upload Questions"
        action={
          <Button variant="secondary" onClick={downloadSample} icon={<Download className="h-4 w-4" />}>
            Download Sample
          </Button>
        }
      />

      <Card className="mt-6">
        <CardContent>
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Drop your Excel or CSV file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Supports .xlsx, .xls, .csv (max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {file && !preview && !importResult && (
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-primary-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {validateMutation.isPending && (
                <p className="text-sm text-slate-500">Validating...</p>
              )}
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {validateMutation.isError && (
            <div className="mt-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-400">
              Failed to validate file. Please check the format and try again.
            </div>
          )}

          {preview && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Total rows: <strong>{preview.total_rows}</strong>
                </span>
                <span className="text-emerald-600">
                  Valid: <strong>{preview.valid_count}</strong>
                </span>
                {preview.invalid_count > 0 && (
                  <span className="text-rose-600">
                    Invalid: <strong>{preview.invalid_count}</strong>
                  </span>
                )}
              </div>

              <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">#</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Question</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">A</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">B</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">C</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">D</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Answer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Marks</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {preview.rows.map((row) => (
                      <tr
                        key={row.row}
                        className={row.errors.length > 0 ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}
                      >
                        <td className="px-3 py-2 text-slate-500">{row.row}</td>
                        <td className="px-3 py-2 text-slate-900 dark:text-slate-100">{row.category}</td>
                        <td className="max-w-[200px] truncate px-3 py-2 text-slate-900 dark:text-slate-100">{row.question}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_a}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_b}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_c}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.option_d}</td>
                        <td className="px-3 py-2 font-medium text-primary-600">{row.correct_answer}</td>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{row.marks}</td>
                        <td className="px-3 py-2">
                          {row.errors.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-600">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {row.errors[0]}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Valid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={reset}>Cancel</Button>
                <Button
                  onClick={() => importMutation.mutate(validRows)}
                  loading={importMutation.isPending}
                  disabled={validRows.length === 0}
                >
                  Import {validRows.length} Questions
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-6 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-emerald-600 mb-2" />
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {importResult.imported} questions imported successfully
                </p>
                {importResult.failed > 0 && (
                  <p className="mt-1 text-sm text-rose-600">
                    {importResult.failed} questions failed
                  </p>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/20 p-4">
                  <p className="mb-2 text-sm font-medium text-rose-700 dark:text-rose-400">Errors:</p>
                  <ul className="space-y-1 text-sm text-rose-600">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={reset}>Upload Another</Button>
                <Button onClick={() => navigate('/admin/questions')}>Go to Question Bank</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

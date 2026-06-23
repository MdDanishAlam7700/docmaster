import {
  FileText, Combine, Scissors, Minimize2, RotateCw, Trash2,
  GripVertical, Crop, Hash, Droplets, Type, Lock, Unlock,
  PenTool, Layers, Wrench, GitCompare, ShieldCheck, EyeOff,
  FormInput, FileImage, Table, Presentation, Mail, Image,
  FileSpreadsheet, Code, FileCode, QrCode, Calculator,
  ArrowRightLeft, FileOutput, FileInput, Download, Upload,
  ScanText, Pencil, Maximize, Shrink, Palette, Settings2, Eraser
} from 'lucide-react';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  category: 'pdf-tools' | 'from-pdf' | 'to-pdf' | 'document-conversion' | 'image-tools' | 'utilities';
  href: string;
  color: string;
}

export const tools: ToolDef[] = [
  // PDF Tools
  { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple PDF files into one document', icon: Combine, category: 'pdf-tools', href: '/tools/merge-pdf', color: 'bg-blue-500' },
  { id: 'split-pdf', name: 'Split PDF', description: 'Split PDF into multiple files by page ranges', icon: Scissors, category: 'pdf-tools', href: '/tools/split-pdf', color: 'bg-blue-500' },
  { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce PDF file size while maintaining quality', icon: Minimize2, category: 'pdf-tools', href: '/tools/compress-pdf', color: 'bg-blue-500' },
  { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate PDF pages to the correct orientation', icon: RotateCw, category: 'pdf-tools', href: '/tools/rotate-pdf', color: 'bg-blue-500' },
  { id: 'delete-pages', name: 'Delete Pages', description: 'Remove unwanted pages from a PDF document', icon: Trash2, category: 'pdf-tools', href: '/tools/delete-pages', color: 'bg-blue-500' },
  { id: 'extract-pages', name: 'Extract Pages', description: 'Extract specific pages as a new PDF file', icon: FileOutput, category: 'pdf-tools', href: '/tools/extract-pages', color: 'bg-blue-500' },
  { id: 'reorder-pages', name: 'Reorder Pages', description: 'Drag and drop to rearrange PDF pages', icon: GripVertical, category: 'pdf-tools', href: '/tools/reorder-pages', color: 'bg-blue-500' },
  { id: 'crop-pdf', name: 'Crop PDF', description: 'Crop PDF pages to remove margins', icon: Crop, category: 'pdf-tools', href: '/tools/crop-pdf', color: 'bg-blue-500' },
  { id: 'page-numbers', name: 'Page Numbers', description: 'Add page numbers to PDF documents', icon: Hash, category: 'pdf-tools', href: '/tools/page-numbers', color: 'bg-blue-500' },
  { id: 'watermark', name: 'Add Watermark', description: 'Add text or image watermark to PDF pages', icon: Droplets, category: 'pdf-tools', href: '/tools/watermark', color: 'bg-blue-500' },
  { id: 'header-footer', name: 'Header & Footer', description: 'Add custom header and footer to PDF', icon: Type, category: 'pdf-tools', href: '/tools/header-footer', color: 'bg-blue-500' },
  { id: 'protect-pdf', name: 'Protect PDF', description: 'Add password protection to PDF files', icon: Lock, category: 'pdf-tools', href: '/tools/protect-pdf', color: 'bg-blue-500' },
  { id: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove password protection from PDF files', icon: Unlock, category: 'pdf-tools', href: '/tools/unlock-pdf', color: 'bg-blue-500' },
  { id: 'sign-pdf', name: 'Sign PDF', description: 'Add digital signature to PDF documents', icon: PenTool, category: 'pdf-tools', href: '/tools/sign-pdf', color: 'bg-blue-500' },
  { id: 'flatten-pdf', name: 'Flatten PDF', description: 'Flatten form fields and annotations', icon: Layers, category: 'pdf-tools', href: '/tools/flatten-pdf', color: 'bg-blue-500' },
  { id: 'repair-pdf', name: 'Repair PDF', description: 'Fix corrupted or damaged PDF files', icon: Wrench, category: 'pdf-tools', href: '/tools/repair-pdf', color: 'bg-blue-500' },
  { id: 'compare-pdf', name: 'Compare PDF', description: 'Compare two PDF files side by side', icon: GitCompare, category: 'pdf-tools', href: '/tools/compare-pdf', color: 'bg-blue-500' },
  { id: 'pdf-to-pdfa', name: 'PDF to PDF/A', description: 'Convert PDF to archival PDF/A format', icon: ShieldCheck, category: 'pdf-tools', href: '/tools/pdf-to-pdfa', color: 'bg-blue-500' },
  { id: 'redact-pdf', name: 'Redact PDF', description: 'Permanently black out sensitive content', icon: Eraser, category: 'pdf-tools', href: '/tools/redact-pdf', color: 'bg-blue-500' },
  { id: 'fill-forms', name: 'Fill PDF Forms', description: 'Fill interactive PDF form fields', icon: FormInput, category: 'pdf-tools', href: '/tools/fill-forms', color: 'bg-blue-500' },

  // Convert FROM PDF
  { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF to editable Word documents', icon: FileText, category: 'from-pdf', href: '/tools/pdf-to-word', color: 'bg-purple-500' },
  { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Extract PDF tables to Excel spreadsheets', icon: Table, category: 'from-pdf', href: '/tools/pdf-to-excel', color: 'bg-purple-500' },
  { id: 'pdf-to-powerpoint', name: 'PDF to PowerPoint', description: 'Convert PDF pages to PowerPoint slides', icon: Presentation, category: 'from-pdf', href: '/tools/pdf-to-powerpoint', color: 'bg-purple-500' },
  { id: 'pdf-to-jpg', name: 'PDF to JPG', description: 'Convert PDF pages to JPEG images', icon: Image, category: 'from-pdf', href: '/tools/pdf-to-jpg', color: 'bg-purple-500' },
  { id: 'pdf-to-png', name: 'PDF to PNG', description: 'Convert PDF pages to PNG images', icon: Image, category: 'from-pdf', href: '/tools/pdf-to-png', color: 'bg-purple-500' },
  { id: 'pdf-to-text', name: 'PDF to Text', description: 'Extract plain text from PDF documents', icon: FileText, category: 'from-pdf', href: '/tools/pdf-to-text', color: 'bg-purple-500' },
  { id: 'pdf-to-html', name: 'PDF to HTML', description: 'Convert PDF to web page HTML format', icon: Code, category: 'from-pdf', href: '/tools/pdf-to-html', color: 'bg-purple-500' },
  { id: 'pdf-to-svg', name: 'PDF to SVG', description: 'Convert PDF to scalable vector graphics', icon: FileCode, category: 'from-pdf', href: '/tools/pdf-to-svg', color: 'bg-purple-500' },
  { id: 'ocr-pdf', name: 'OCR PDF', description: 'Make scanned PDF searchable with OCR', icon: ScanText, category: 'from-pdf', href: '/tools/ocr-pdf', color: 'bg-purple-500' },

  // Convert TO PDF
  { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert Word documents to PDF format', icon: FileText, category: 'to-pdf', href: '/tools/word-to-pdf', color: 'bg-green-500' },
  { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Convert Excel spreadsheets to PDF', icon: FileSpreadsheet, category: 'to-pdf', href: '/tools/excel-to-pdf', color: 'bg-green-500' },
  { id: 'powerpoint-to-pdf', name: 'PowerPoint to PDF', description: 'Convert PowerPoint presentations to PDF', icon: Presentation, category: 'to-pdf', href: '/tools/powerpoint-to-pdf', color: 'bg-green-500' },
  { id: 'jpg-to-pdf', name: 'JPG to PDF', description: 'Convert JPEG images to PDF documents', icon: Image, category: 'to-pdf', href: '/tools/jpg-to-pdf', color: 'bg-green-500' },
  { id: 'png-to-pdf', name: 'PNG to PDF', description: 'Convert PNG images to PDF documents', icon: Image, category: 'to-pdf', href: '/tools/png-to-pdf', color: 'bg-green-500' },
  { id: 'text-to-pdf', name: 'Text to PDF', description: 'Convert plain text files to PDF', icon: FileText, category: 'to-pdf', href: '/tools/text-to-pdf', color: 'bg-green-500' },
  { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Convert web pages to PDF documents', icon: Code, category: 'to-pdf', href: '/tools/html-to-pdf', color: 'bg-green-500' },
  { id: 'svg-to-pdf', name: 'SVG to PDF', description: 'Convert SVG vector graphics to PDF', icon: FileCode, category: 'to-pdf', href: '/tools/svg-to-pdf', color: 'bg-green-500' },
  { id: 'markdown-to-pdf', name: 'Markdown to PDF', description: 'Convert Markdown files to styled PDF', icon: FileText, category: 'to-pdf', href: '/tools/markdown-to-pdf', color: 'bg-green-500' },

  // Document Conversion
  { id: 'word-to-excel', name: 'Word to Excel', description: 'Extract data from Word to Excel', icon: ArrowRightLeft, category: 'document-conversion', href: '/tools/word-to-excel', color: 'bg-orange-500' },
  { id: 'excel-to-word', name: 'Excel to Word', description: 'Convert Excel data to Word documents', icon: ArrowRightLeft, category: 'document-conversion', href: '/tools/excel-to-word', color: 'bg-orange-500' },
  { id: 'word-to-powerpoint', name: 'Word to PowerPoint', description: 'Convert Word outline to presentation', icon: ArrowRightLeft, category: 'document-conversion', href: '/tools/word-to-powerpoint', color: 'bg-orange-500' },
  { id: 'html-to-word', name: 'HTML to Word', description: 'Convert HTML pages to Word documents', icon: FileText, category: 'document-conversion', href: '/tools/html-to-word', color: 'bg-orange-500' },
  { id: 'csv-to-excel', name: 'CSV to Excel', description: 'Convert CSV files to Excel spreadsheets', icon: FileSpreadsheet, category: 'document-conversion', href: '/tools/csv-to-excel', color: 'bg-orange-500' },
  { id: 'excel-to-csv', name: 'Excel to CSV', description: 'Export Excel sheets to CSV format', icon: FileSpreadsheet, category: 'document-conversion', href: '/tools/excel-to-csv', color: 'bg-orange-500' },
  { id: 'html-to-markdown', name: 'HTML to Markdown', description: 'Convert HTML to clean Markdown', icon: FileText, category: 'document-conversion', href: '/tools/html-to-markdown', color: 'bg-orange-500' },
  { id: 'markdown-to-html', name: 'Markdown to HTML', description: 'Convert Markdown to HTML web page', icon: FileText, category: 'document-conversion', href: '/tools/markdown-to-html', color: 'bg-orange-500' },

  // Image Tools
  { id: 'image-to-word', name: 'Image to Word', description: 'OCR image text into editable Word doc', icon: FileText, category: 'image-tools', href: '/tools/image-to-word', color: 'bg-pink-500' },
  { id: 'image-to-excel', name: 'Image to Excel', description: 'Extract tables from images to Excel', icon: Table, category: 'image-tools', href: '/tools/image-to-excel', color: 'bg-pink-500' },
  { id: 'image-to-text', name: 'Image to Text', description: 'Extract text from images with OCR', icon: ScanText, category: 'image-tools', href: '/tools/image-to-text', color: 'bg-pink-500' },
  { id: 'resize-image', name: 'Resize Image', description: 'Change image dimensions and size', icon: Maximize, category: 'image-tools', href: '/tools/resize-image', color: 'bg-pink-500' },
  { id: 'compress-image', name: 'Compress Image', description: 'Reduce image file size significantly', icon: Shrink, category: 'image-tools', href: '/tools/compress-image', color: 'bg-pink-500' },
  { id: 'crop-image', name: 'Crop Image', description: 'Cut and crop image areas precisely', icon: Crop, category: 'image-tools', href: '/tools/crop-image', color: 'bg-pink-500' },
  { id: 'convert-image', name: 'Convert Image', description: 'Convert between image formats (PNG, JPG, WebP)', icon: Palette, category: 'image-tools', href: '/tools/convert-image', color: 'bg-pink-500' },

  // Utilities
  { id: 'word-counter', name: 'Word Counter', description: 'Count words, characters, and paragraphs', icon: Calculator, category: 'utilities', href: '/tools/word-counter', color: 'bg-teal-500' },
  { id: 'qr-generator', name: 'QR Code Generator', description: 'Generate QR codes from text or URLs', icon: QrCode, category: 'utilities', href: '/tools/qr-generator', color: 'bg-teal-500' },
];

export const categories = [
  { id: 'pdf-tools' as const, name: 'PDF Tools', description: 'Manipulate, organize, and enhance PDF files' },
  { id: 'from-pdf' as const, name: 'Convert from PDF', description: 'Convert PDF to other formats' },
  { id: 'to-pdf' as const, name: 'Convert to PDF', description: 'Convert files into PDF format' },
  { id: 'document-conversion' as const, name: 'Document Conversion', description: 'Convert between document formats' },
  { id: 'image-tools' as const, name: 'Image Tools', description: 'Edit, convert, and process images' },
  { id: 'utilities' as const, name: 'Utilities', description: 'Useful tools and generators' },
];

export function getToolsByCategory(category: string) {
  return tools.filter(t => t.category === category);
}

export function getToolById(id: string) {
  return tools.find(t => t.id === id);
}

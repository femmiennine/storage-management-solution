"use client";

import { useState, useEffect } from 'react';
import { FileDocument } from '@/lib/actions/file.actions';
import { Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextPreviewProps {
  file: FileDocument;
}

export function TextPreview({ file }: TextPreviewProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lineNumbers, setLineNumbers] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [file.fileUrl]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(file.fileUrl);
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error('Error loading file content:', error);
      setContent('Error loading file content');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getLanguageFromFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'kt': 'kotlin',
      'swift': 'swift',
      'md': 'markdown',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'yaml': 'yaml',
      'yml': 'yaml',
      'toml': 'toml',
      'ini': 'ini',
      'dockerfile': 'dockerfile',
      'docker': 'dockerfile',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const lines = content.split('\n');
  const language = getLanguageFromFileType(file.fileName);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {language} • {lines.length} lines
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLineNumbers(!lineNumbers)}
          >
            Line Numbers
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-zinc-950 p-4">
        <pre className="text-sm">
          <code className="text-zinc-300">
            {lines.map((line, index) => (
              <div key={index} className="flex">
                {lineNumbers && (
                  <span className="text-zinc-600 select-none mr-4 text-right" style={{ minWidth: '3ch' }}>
                    {index + 1}
                  </span>
                )}
                <span className="flex-1">
                  {line || '\n'}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
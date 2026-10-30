import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export interface ImportedFile {
  uri: string;
  name: string;
  format: 'epub' | 'pdf';
}

/** Pick an EPUB or PDF from device storage. Returns null if user cancelled. */
export async function pickBookFile(): Promise<ImportedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/epub+zip', 'application/pdf'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const name = asset.name ?? 'Unknown';
  const ext = name.split('.').pop()?.toLowerCase();
  const format = ext === 'epub' ? 'epub' : 'pdf';

  return { uri: asset.uri, name, format };
}

/** Copy a picked file into the app's permanent books directory. Returns the new path. */
export async function copyToAppStorage(uri: string, filename: string): Promise<string> {
  const baseDir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  const dir = (baseDir.endsWith('/') ? baseDir : baseDir + '/') + 'books/';
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  const dest = dir + encodeURIComponent(filename);
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

/** Delete a book file from app storage. */
export async function deleteBookFile(filePath: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) await FileSystem.deleteAsync(filePath, { idempotent: true });
  } catch {
    // ignore
  }
}

/**
 * Extract basic metadata from an EPUB's OPF file without a full parser.
 * Returns null on failure — caller should fall back to the filename.
 */
export async function extractEpubMetadata(filePath: string): Promise<{ title?: string; author?: string } | null> {
  try {
    // EPUBs are ZIP files. We read as base64 and look for <dc:title> and <dc:creator>
    // For a lightweight approach without a native unzip library we use a regex scan.
    // A proper epubjs integration would replace this in a WebView context.
    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    }).catch(() => null);
    if (!content) return null;
    const titleMatch = content.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    const authorMatch = content.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    return {
      title: titleMatch?.[1]?.trim(),
      author: authorMatch?.[1]?.trim(),
    };
  } catch {
    return null;
  }
}

/** Derive a friendly title from a filename (strip extension and replace underscores/hyphens). */
export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.(epub|pdf)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

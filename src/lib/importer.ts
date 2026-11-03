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
    copyToCacheDirectory: false,
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

  // Sanitize filename to avoid invalid characters or malformed percent-encoding on Android filesystem
  const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const dest = dir + safeName;

  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    // If native copyAsync fails, read via fetch/blob or SAF and write to dest
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const res = reader.result as string;
          const commaIdx = res.indexOf(',');
          resolve(commaIdx >= 0 ? res.slice(commaIdx + 1) : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await FileSystem.writeAsStringAsync(dest, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return dest;
    } catch {
      // Last-resort fallback for local paths
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await FileSystem.writeAsStringAsync(dest, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return dest;
    }
  }
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
 * Extract basic metadata and chapters from an EPUB using JSZip.
 */
import JSZip from 'jszip';

export interface EpubChapter {
  id: string;
  title: string;
  html: string;
}

export async function parseEpub(filePath: string): Promise<{
  title?: string;
  author?: string;
  chapters: EpubChapter[];
} | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64) return null;

    const zip = new JSZip();
    const zipContent = await zip.loadAsync(base64, { base64: true });

    // 1. Read container.xml to locate the OPF package path
    const container = zipContent.file('META-INF/container.xml');
    if (!container) return null;
    const containerXml = await container.async('text');
    const opfMatch = containerXml.match(/full-path="([^"]+)"/i);
    const opfPath = opfMatch?.[1];
    if (!opfPath) return null;

    // 2. Read OPF file
    const opfFile = zipContent.file(opfPath);
    if (!opfFile) return null;
    const opfXml = await opfFile.async('text');

    const titleMatch = opfXml.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
    const authorMatch = opfXml.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
    const title = titleMatch?.[1]?.trim();
    const author = authorMatch?.[1]?.trim();

    // 3. Extract spine & manifest items
    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    
    // Manifest mapping id -> href
    const manifest: Record<string, string> = {};
    const itemRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"[^>]*>/gi;
    let itemMatch: RegExpExecArray | null;
    while ((itemMatch = itemRegex.exec(opfXml)) !== null) {
      manifest[itemMatch[1]] = itemMatch[2];
    }
    // Also handle reverse attribute order: href then id
    const itemRegex2 = /<item\s+[^>]*href="([^"]+)"[^>]*id="([^"]+)"[^>]*>/gi;
    while ((itemMatch = itemRegex2.exec(opfXml)) !== null) {
      manifest[itemMatch[2]] = itemMatch[1];
    }

    // Spine items
    const spineIds: string[] = [];
    const spineRegex = /<itemref\s+[^>]*idref="([^"]+)"[^>]*>/gi;
    let spineMatch: RegExpExecArray | null;
    while ((spineMatch = spineRegex.exec(opfXml)) !== null) {
      spineIds.push(spineMatch[1]);
    }

    const chapters: EpubChapter[] = [];

    // Extract in spine order
    for (const id of spineIds) {
      const href = manifest[id];
      if (!href) continue;
      const cleanHref = href.split('#')[0];
      const fullPath = opfDir + cleanHref;
      const file = zipContent.file(fullPath) || zipContent.file(decodeURIComponent(fullPath));
      if (!file) continue;

      let html = await file.async('text');
      // Extract body content or sanitize
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const innerHtml = bodyMatch ? bodyMatch[1] : html;

      // Clean images and scripts to keep webview fast and safe
      const cleanHtml = innerHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<img\b[^>]*>/gi, '');

      // Try extracting heading as chapter title
      const hMatch = cleanHtml.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
      const chTitle = hMatch ? hMatch[1].trim() : `Chapter ${chapters.length + 1}`;

      chapters.push({
        id,
        title: chTitle,
        html: cleanHtml,
      });
    }

    // Fallback if spine parsing didn't find chapters: extract any html/xhtml files
    if (chapters.length === 0) {
      const allFiles = Object.keys(zipContent.files).filter((f) => /\.(html|xhtml|htm)$/i.test(f));
      for (let i = 0; i < allFiles.length; i++) {
        const f = allFiles[i];
        const content = await zipContent.files[f].async('text');
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        chapters.push({
          id: String(i),
          title: `Section ${i + 1}`,
          html: bodyMatch ? bodyMatch[1] : content,
        });
      }
    }

    return { title, author, chapters };
  } catch (err) {
    console.error('Failed to parse EPUB with JSZip:', err);
    return null;
  }
}

export async function extractEpubMetadata(filePath: string): Promise<{ title?: string; author?: string } | null> {
  const parsed = await parseEpub(filePath);
  if (parsed && (parsed.title || parsed.author)) {
    return { title: parsed.title, author: parsed.author };
  }
  return null;
}

/** Derive a friendly title from a filename (strip extension and replace underscores/hyphens). */
export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.(epub|pdf)$/i, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

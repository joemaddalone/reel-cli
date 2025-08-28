import * as fs from 'fs';
import * as path from 'path';
import { FileSystemError } from '../types';

export class FileHelpers {
  /**
   * Ensure a directory exists, creating it if necessary
   */
  public static ensureDirectoryExists(dirPath: string): void {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to create directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        dirPath,
        'create',
        { error }
      );
    }
  }

  /**
   * Check if a path is writable
   */
  public static isWritable(dirPath: string): boolean {
    try {
      // Try to create a temporary file to test write permissions
      const testFile = path.join(dirPath, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize a filename for safe file system usage
   */
  public static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 255); // Limit length
  }

  /**
   * Create a safe directory name for a film
   */
  public static createFilmDirectoryName(filmId: number, filmTitle: string): string {
    const sanitizedTitle = this.sanitizeFilename(filmTitle);
    return `${filmId}-${sanitizedTitle}`;
  }

  /**
   * Write JSON data to a file
   */
  public static writeJsonFile(filePath: string, data: any): void {
    try {
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      this.ensureDirectoryExists(dirPath);

      // Write JSON file
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      throw new FileSystemError(
        `Failed to write JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        'write',
        { error, data: typeof data }
      );
    }
  }

  /**
   * Write text data to a file
   */
  public static writeTextFile(filePath: string, content: string): void {
    try {
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      this.ensureDirectoryExists(dirPath);

      // Write text file
      fs.writeFileSync(filePath, content, 'utf8');
    } catch (error) {
      throw new FileSystemError(
        `Failed to write text file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        'write',
        { error, contentLength: content.length }
      );
    }
  }

  /**
   * Check if a file exists
   */
  public static fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  /**
   * Check if a directory exists
   */
  public static directoryExists(dirPath: string): boolean {
    try {
      return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get file size in bytes
   */
  public static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      throw new FileSystemError(
        `Failed to get file size: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        'stat',
        { error }
      );
    }
  }

  /**
   * Get directory contents
   */
  public static getDirectoryContents(dirPath: string): string[] {
    try {
      if (!this.directoryExists(dirPath)) {
        return [];
      }
      return fs.readdirSync(dirPath);
    } catch (error) {
      throw new FileSystemError(
        `Failed to read directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        dirPath,
        'readdir',
        { error }
      );
    }
  }

  /**
   * Remove a file
   */
  public static removeFile(filePath: string): void {
    try {
      if (this.fileExists(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to remove file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        filePath,
        'remove',
        { error }
      );
    }
  }

  /**
   * Remove a directory and its contents
   */
  public static removeDirectory(dirPath: string): void {
    try {
      if (this.directoryExists(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (error) {
      throw new FileSystemError(
        `Failed to remove directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        dirPath,
        'remove',
        { error }
      );
    }
  }

  /**
   * Copy a file to a new location
   */
  public static copyFile(sourcePath: string, destPath: string): void {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      this.ensureDirectoryExists(destDir);

      // Copy file
      fs.copyFileSync(sourcePath, destPath);
    } catch (error) {
      throw new FileSystemError(
        `Failed to copy file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        destPath,
        'copy',
        { error, sourcePath }
      );
    }
  }

  /**
   * Get absolute path, resolving relative paths
   */
  public static getAbsolutePath(filePath: string): string {
    return path.resolve(filePath);
  }

  /**
   * Get relative path from base directory
   */
  public static getRelativePath(filePath: string, baseDir: string): string {
    return path.relative(baseDir, filePath);
  }

  /**
   * Join path segments safely
   */
  public static joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }
}

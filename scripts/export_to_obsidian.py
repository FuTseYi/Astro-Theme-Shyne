#!/usr/bin/env python3
"""
Astro to Obsidian Content Exporter - Pure Python (No Dependencies)

Exports markdown files from Astro blog/photos back to Obsidian vault format.
Reverse of import_obsidian.py. Useful for round-trip editing workflows.

Usage:
    python scripts/export_to_obsidian.py

Configuration:
    Reuses the same .env as import_obsidian.py, but swaps source/target:
    - Reads from TARGET_BLOG_DIR / TARGET_PHOTOS_DIR (Astro content)
    - Writes to SOURCE_BLOG_DIR / SOURCE_PHOTOS_DIR (Obsidian vault)
    - Copies images from {content}/assets/ to SOURCE_*_ATTACHMENT_DIR

Environment variables (.env):
    IMPORT_TYPE                  - Export type: "blog", "photos", or "all"
    IMPORT_MODE                  - Export mode: "update" (default), "force", or "skip"
    SOURCE_BLOG_DIR              - Obsidian vault target for blog .md files
    SOURCE_BLOG_ATTACHMENT_DIR   - Obsidian vault target for blog images
    TARGET_BLOG_DIR              - Astro blog source directory
    SOURCE_PHOTOS_DIR            - Obsidian vault target for photo .md files
    SOURCE_PHOTOS_ATTACHMENT_DIR - Obsidian vault target for photo images
    TARGET_PHOTOS_DIR            - Astro photos source directory

Round-Trip Workflow:
    1. python scripts/export_to_obsidian.py   # Bring blog content back to Obsidian
    2. Edit in Obsidian
    3. python scripts/import_obsidian.py       # Re-import to Astro blog
"""

import os
import re
import shutil
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Tuple
from urllib.parse import unquote

# Ensure UTF-8 output on all platforms (especially Windows with GBK locale)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass


# ============================================================================
# LOGGING UTILITIES
# ============================================================================

class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    RED = '\033[31m'
    CYAN = '\033[36m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'

    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'


class Logger:
    verbose_enabled = False

    @classmethod
    def set_verbose(cls, enabled: bool):
        cls.verbose_enabled = enabled

    def info(self, msg: str):
        print(f"{Colors.CYAN}ℹ {Colors.RESET}{msg}")

    def success(self, msg: str):
        print(f"{Colors.BRIGHT_GREEN}✓ {Colors.RESET}{msg}")

    def warn(self, msg: str):
        print(f"{Colors.YELLOW}⚠ {Colors.RESET}{msg}")

    def error(self, msg: str):
        print(f"{Colors.RED}✗ {Colors.RESET}{msg}")

    def verbose(self, msg: str):
        if self.verbose_enabled:
            print(f"{Colors.DIM}    {msg}{Colors.RESET}")

    def step(self, msg: str):
        print(f"\n{Colors.BOLD}{Colors.BRIGHT_CYAN}{msg}{Colors.RESET}")

    def header(self, msg: str):
        print(f"\n{Colors.BOLD}{Colors.BRIGHT_WHITE}{msg}{Colors.RESET}")

    def dim(self, msg: str):
        print(f"{Colors.DIM}  {msg}{Colors.RESET}")


log = Logger()


# ============================================================================
# CUSTOM EXCEPTIONS
# ============================================================================

class ImageNotFoundError(Exception):
    pass


class ValidationError(Exception):
    pass


class SkipFileError(Exception):
    pass


# ============================================================================
# YAML PARSER (MINIMAL, NO DEPENDENCIES)
# ============================================================================

def parse_yaml_value(value: str):
    """Parse a simple YAML value (string, number, boolean, list)"""
    value = value.strip()

    if value.lower() in ('true', 'yes', 'on'):
        return True
    if value.lower() in ('false', 'no', 'off'):
        return False
    if value.lower() in ('null', 'none', '~', ''):
        return None

    try:
        if '.' in value:
            return float(value)
        return int(value)
    except ValueError:
        pass

    if (value.startswith('"') and value.endswith('"')) or \
       (value.startswith("'") and value.endswith("'")):
        value = value[1:-1]

    if isinstance(value, str):
        value = value.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\\r', '\n')

    return value


def parse_simple_yaml(text: str) -> Dict:
    """Parse simple YAML frontmatter (strings, numbers, booleans, simple lists)"""
    result = {}
    lines = text.strip().split('\n')
    current_key = None
    current_list = []

    for line in lines:
        if line.strip().startswith('- '):
            item = line.strip()[2:].strip()
            current_list.append(parse_yaml_value(item))
            continue

        if ':' in line and not line.strip().startswith('#'):
            if current_key and current_list:
                result[current_key] = current_list
                current_list = []

            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip()

            if value:
                result[key] = parse_yaml_value(value)
                current_key = None
            else:
                current_key = key

    if current_key and current_list:
        result[current_key] = current_list

    return result


def parse_frontmatter(content: str) -> Tuple[Dict, str]:
    """Extract and parse YAML frontmatter from markdown content."""
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return {}, content

    yaml_text = match.group(1)
    body = match.group(2)

    try:
        frontmatter = parse_simple_yaml(yaml_text)
        return frontmatter, body
    except Exception as e:
        log.warn(f"failed to parse frontmatter: {e}")
        return {}, content


def build_frontmatter_text(fm: Dict) -> str:
    """Build YAML frontmatter text from dictionary"""
    lines = ['---']
    fold_to_single_line_keys = {'description', 'summary', 'excerpt'}

    for key, value in fm.items():
        if isinstance(value, list):
            lines.append(f'{key}:')
            for item in value:
                lines.append(f'  - {item}')
        elif isinstance(value, bool):
            lines.append(f'{key}: {str(value).lower()}')
        elif isinstance(value, str):
            value = value.replace('\r\n', '\n').replace('\r', '\n')

            if key in fold_to_single_line_keys:
                value = re.sub(r'\s*\n\s*', ' ', value).strip()
                value = re.sub(r'\s{2,}', ' ', value)

            if '\n' in value:
                lines.append(f'{key}: |')
                for line in value.split('\n'):
                    lines.append(f'  {line}')
                continue

            if ':' in value or '#' in value or value.startswith('-'):
                lines.append(f'{key}: "{value}"')
            else:
                lines.append(f'{key}: {value}')
        elif value is None:
            lines.append(f'{key}:')
        else:
            lines.append(f'{key}: {value}')

    lines.append('---')
    return '\n'.join(lines)


# ============================================================================
# FILE UTILITIES
# ============================================================================

def is_markdown_file(filename: str) -> bool:
    return filename.endswith('.md')


def get_basename(filepath: str) -> str:
    return Path(filepath).stem


def normalize_image_name(image_name: str) -> str:
    path = Path(image_name)
    normalized = path.stem.lower().replace(' ', '-')
    return f"{normalized}{path.suffix}"


def should_export_file(source_file: Path, target_file: Path, mode: str) -> Tuple[bool, str]:
    """Determine if a file should be exported based on mode.

    update mode uses file modification time (mtime). Same rationale as
    import: export transforms content, so source/target are never byte-identical.
    mtime answers: "was the Astro content edited since last export?"
    """
    if not target_file.exists():
        return True, 'new'

    if mode == 'force':
        return True, 'forced'

    if mode == 'skip':
        return False, 'skipped'

    if source_file.stat().st_mtime > target_file.stat().st_mtime:
        return True, 'updated'

    return False, 'exists'


def is_remote_url(url: str) -> bool:
    s = url.strip().lower()
    return s.startswith(('http://', 'https://', 'data:', 'mailto:'))


# ============================================================================
# IMAGE REVERSE CONVERSION (Astro markdown → Obsidian embed)
# ============================================================================

MARKDOWN_IMAGE_REGEX = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')
IMAGE_FRONTMATTER_PATH = re.compile(r'^\./assets/(.+)$')


def convert_images_in_body(body: str, assets_dir: Path, attachment_dir: Path, filename: str, assets_subdir: str = 'assets') -> str:
    """
    Copy images from Astro assets/ to Obsidian assets/ and keep markdown format.
    ![alt](./assets/img.png) stays as ![alt](./assets/img.png)
    Images are copied to {attachment_dir}/{assets_subdir}/ preserving the same relative structure.
    """
    if not body:
        return body

    md_matches = list(MARKDOWN_IMAGE_REGEX.finditer(body))
    if not md_matches:
        return body

    copy_plan = {}
    obsidian_assets = attachment_dir / assets_subdir

    for match in md_matches:
        paren = match.group(2)
        url, _, _ = parse_markdown_paren_content(paren)

        if not url or is_remote_url(url):
            continue

        # Match ./assets/filename or assets/filename
        m = IMAGE_FRONTMATTER_PATH.match(url.strip())
        if not m:
            m = re.match(r'^assets/(.+)$', url.strip())
        if not m:
            continue

        image_filename = m.group(1)

        if image_filename not in copy_plan:
            source_path = assets_dir / image_filename
            if not source_path.exists():
                log.warn(f"Image not found, skipping copy: {source_path}")
                continue

            dest_path = obsidian_assets / image_filename
            obsidian_assets.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, dest_path)
            log.verbose(f"image: {image_filename} → {attachment_dir.name}/{assets_subdir}/{image_filename}")
            copy_plan[image_filename] = image_filename

    # No text replacement needed — markdown format stays the same
    return body


def parse_markdown_paren_content(content: str) -> Tuple[str, Optional[str], Optional[str]]:
    """Parse markdown image parenthesis content: (url "title")"""
    raw = content.strip()

    if raw.startswith('<'):
        close = raw.find('>')
        if close != -1:
            inside = raw[1:close].strip()
            rest = raw[close + 1:].strip()
            raw = inside + (' ' + rest if rest else '')

    title_match = re.search(r'\s+(["\'])(.*?)\1\s*$', raw)
    if title_match:
        raw_title = title_match.group(0).strip()
        url = raw[:len(raw) - len(title_match.group(0))].strip()
        return url, title_match.group(2), raw_title

    return raw.strip(), None, None


def convert_frontmatter_image(fm: Dict, key: str, assets_dir: Path, attachment_dir: Path, filename: str, assets_subdir: str = 'assets'):
    """
    Copy frontmatter image to Obsidian assets/ and keep markdown path format.
    ./assets/banner.png stays as ./assets/banner.png (copied to target assets/)
    Returns True if an image was copied.
    """
    value = fm.get(key)
    if not isinstance(value, str):
        return False

    m = IMAGE_FRONTMATTER_PATH.match(value.strip())
    if not m:
        return False

    image_filename = m.group(1)
    source_path = assets_dir / image_filename
    if not source_path.exists():
        log.warn(f"{key} image not found, keeping original: {source_path}")
        return False

    obsidian_assets = attachment_dir / assets_subdir
    obsidian_assets.mkdir(parents=True, exist_ok=True)
    dest_path = obsidian_assets / image_filename
    shutil.copy2(source_path, dest_path)
    log.verbose(f"{key}: {image_filename} → {attachment_dir.name}/{assets_subdir}/{image_filename}")

    # Keep the original ./assets/ path (works in both Astro and Obsidian)
    fm[key] = f"./assets/{image_filename}"
    return True


def convert_favicon(fm: Dict, assets_dir: Path, attachment_dir: Path, filename: str, assets_subdir: str = 'assets'):
    """
    Process favicon: if it's an image path, copy to Obsidian assets/ and keep path.
    If it's an emoji, hex color, or number, leave as-is.
    """
    value = fm.get('favicon')
    if not isinstance(value, str):
        return

    if not re.search(r'\.(png|jpe?g|gif|svg|webp|ico|bmp)$', value, re.IGNORECASE):
        return

    if value.startswith('./assets/') or value.startswith('assets/'):
        convert_frontmatter_image(fm, 'favicon', assets_dir, attachment_dir, filename, assets_subdir)


# ============================================================================
# FRONTMATTER CONVERSION (Astro → Obsidian)
# ============================================================================

def convert_astro_frontmatter_to_obsidian(fm: Dict) -> Dict:
    """
    Convert Astro frontmatter conventions back to Obsidian conventions.
    - image → banner
    - Tags kept as-is (Obsidian frontmatter uses #-less tags)
    - draft kept as-is (user's Obsidian vault uses 'draft', not 'is_draft')
    """
    converted = fm.copy()

    # image → banner
    if 'image' in converted:
        converted['banner'] = converted.pop('image')

    # Remove Astro-specific fields that shouldn't go to Obsidian
    converted.pop('order', None)
    converted.pop('iconType', None)

    return converted


# ============================================================================
# EXPORT PROCESSING
# ============================================================================

def process_blog_export(folder_path: Path, config: Dict):
    """
    Export a single Astro blog post back to Obsidian format.
    Reads {folder}/index.md, writes {folder}.md to Obsidian vault.
    """
    index_md = folder_path / 'index.md'
    if not index_md.exists():
        raise SkipFileError(f"[{folder_path.name}] no index.md found")

    content = index_md.read_text(encoding='utf-8')
    fm, body = parse_frontmatter(content)

    # Determine output filename from folder name
    output_filename = f"{folder_path.name}.md"
    output_path = Path(config['obsidian_blog_dir']) / output_filename

    # Check if should export
    should_export, reason = should_export_file(
        index_md, output_path, config['import_mode']
    )
    if not should_export:
        raise SkipFileError(f"[{output_filename}] {reason}")

    # Convert frontmatter to Obsidian conventions
    fm = convert_astro_frontmatter_to_obsidian(fm)

    # Process banner image (image → banner embed)
    assets_dir = folder_path / 'assets'
    attachment_dir = Path(config['obsidian_blog_attachment_dir'])
    if assets_dir.exists() and fm.get('banner'):
        convert_frontmatter_image(
            fm, 'banner', assets_dir, attachment_dir, folder_path.name
        )

    # Process body images
    if assets_dir.exists():
        body = convert_images_in_body(
            body, assets_dir, attachment_dir, folder_path.name
        )

    # Write .md file (trailing newline prevents Obsidian formatter issues)
    final_content = build_frontmatter_text(fm)
    if body.strip():
        final_content += f"\n\n{body.strip()}"
    final_content += '\n'
    output_path.write_text(final_content, encoding='utf-8')

    return reason


def process_photo_export(folder_path: Path, config: Dict):
    """
    Export a single Astro photo album back to Obsidian format.
    """
    index_md = folder_path / 'index.md'
    if not index_md.exists():
        raise SkipFileError(f"[{folder_path.name}] no index.md found")

    content = index_md.read_text(encoding='utf-8')
    fm, body = parse_frontmatter(content)

    output_filename = f"{folder_path.name}.md"
    output_path = Path(config['obsidian_photos_dir']) / output_filename

    should_export, reason = should_export_file(
        index_md, output_path, config['import_mode']
    )
    if not should_export:
        raise SkipFileError(f"[{output_filename}] {reason}")

    # Convert frontmatter
    fm = convert_astro_frontmatter_to_obsidian(fm)

    assets_dir = folder_path / 'assets'
    attachment_dir = Path(config['obsidian_photos_attachment_dir'])

    # Process favicon (if it's an image path)
    if assets_dir.exists():
        convert_favicon(fm, assets_dir, attachment_dir, folder_path.name)

    # Process body images
    if assets_dir.exists():
        body = convert_images_in_body(
            body, assets_dir, attachment_dir, folder_path.name
        )

    # Write .md file (trailing newline prevents Obsidian formatter issues)
    final_content = build_frontmatter_text(fm)
    if body.strip():
        final_content += f"\n\n{body.strip()}"
    final_content += '\n'
    output_path.write_text(final_content, encoding='utf-8')

    return reason


# ============================================================================
# ENVIRONMENT & MAIN
# ============================================================================

def load_env_from_file(env_path: str = '.env'):
    """Simple .env file loader with quote handling"""
    env_file = Path(env_path)
    if not env_file.exists():
        return

    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()

                if (value.startswith('"') and value.endswith('"')) or \
                   (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]

                os.environ[key] = value


def validate_environment():
    """Validate required environment variables"""
    import_type = os.getenv('IMPORT_TYPE', '').lower()
    if not import_type:
        raise ValueError("IMPORT_TYPE is required")
    if import_type not in ['blog', 'photos', 'all']:
        raise ValueError(f"IMPORT_TYPE must be 'blog', 'photos', or 'all', got: {import_type}")

    import_mode = os.getenv('IMPORT_MODE', 'update').lower()
    if import_mode not in ['update', 'force', 'skip']:
        raise ValueError(f"IMPORT_MODE must be 'update', 'force', or 'skip', got: {import_mode}")

    # For export, TARGET_* dirs are the SOURCE (Astro content), they must exist
    if import_type in ['blog', 'all']:
        blog_required = ['TARGET_BLOG_DIR', 'SOURCE_BLOG_DIR', 'SOURCE_BLOG_ATTACHMENT_DIR']
        missing = [key for key in blog_required if not os.getenv(key)]
        if missing:
            raise ValueError(f"missing required blog variables: {', '.join(missing)}")

    if import_type in ['photos', 'all']:
        photos_required = ['TARGET_PHOTOS_DIR', 'SOURCE_PHOTOS_DIR', 'SOURCE_PHOTOS_ATTACHMENT_DIR']
        missing = [key for key in photos_required if not os.getenv(key)]
        if missing:
            raise ValueError(f"missing required photos variables: {', '.join(missing)}")


def get_env_config() -> Dict:
    """Get environment configuration with source/target swapped for export"""
    return {
        'import_type': os.getenv('IMPORT_TYPE', 'blog').lower(),
        'import_mode': os.getenv('IMPORT_MODE', 'update').lower(),
        # Astro sources (TARGET_* in .env — where we read FROM)
        'astro_blog_dir': os.getenv('TARGET_BLOG_DIR', ''),
        'astro_photos_dir': os.getenv('TARGET_PHOTOS_DIR', ''),
        # Obsidian targets (SOURCE_* in .env — where we write TO)
        'obsidian_blog_dir': os.getenv('SOURCE_BLOG_DIR', ''),
        'obsidian_blog_attachment_dir': os.getenv('SOURCE_BLOG_ATTACHMENT_DIR', ''),
        'obsidian_photos_dir': os.getenv('SOURCE_PHOTOS_DIR', ''),
        'obsidian_photos_attachment_dir': os.getenv('SOURCE_PHOTOS_ATTACHMENT_DIR', ''),
    }


def main():
    """Main execution function"""
    load_env_from_file('.env')

    verbose = os.getenv('VERBOSE', os.getenv('IMPORT_VERBOSE', '')).lower() in ('1', 'true', 'yes')
    Logger.set_verbose(verbose)
    validate_environment()
    config = get_env_config()

    import_type = config['import_type']
    import_mode = config['import_mode']

    log.header(f"Astro → Obsidian  ({import_mode} · {import_type})")
    print()

    stats = {
        'blog_new': 0,
        'blog_updated': 0,
        'blog_forced': 0,
        'photo_new': 0,
        'photo_updated': 0,
        'photo_forced': 0,
        'skipped': 0
    }

    # Export blog posts
    if import_type in ['blog', 'all']:
        astro_blog_dir = Path(config['astro_blog_dir'])
        obsidian_blog_dir = Path(config['obsidian_blog_dir'])

        if not astro_blog_dir.exists():
            log.error(f"Astro blog source not found: {astro_blog_dir}")
            sys.exit(1)

        obsidian_blog_dir.mkdir(parents=True, exist_ok=True)

        # Each blog post is a folder containing index.md
        blog_folders = [
            d for d in astro_blog_dir.iterdir()
            if d.is_dir() and (d / 'index.md').exists()
        ]

        if blog_folders:
            log.step(f"Exporting {len(blog_folders)} blog post(s)...")

            total = len(blog_folders)
            for idx, folder in enumerate(sorted(blog_folders), 1):
                try:
                    status = process_blog_export(folder, config)
                    tag = {'new': ' ', 'updated': f' {Colors.YELLOW}upd{Colors.RESET}', 'forced': f' {Colors.MAGENTA}fc{Colors.RESET}'}.get(status, '')
                    log.success(f"[{idx}/{total}]{tag} {folder.name}")
                    if status == 'new':
                        stats['blog_new'] += 1
                    elif status == 'updated':
                        stats['blog_updated'] += 1
                    elif status == 'forced':
                        stats['blog_forced'] += 1

                except SkipFileError as e:
                    log.dim(f"[{idx}/{total}]   {folder.name}  (unchanged)")
                    stats['skipped'] += 1
                except Exception as e:
                    log.error(f"Export failed: {folder.name} - {str(e)}")
                    sys.exit(1)
            print()

    # Export photo albums
    if import_type in ['photos', 'all']:
        astro_photos_dir = Path(config['astro_photos_dir'])
        obsidian_photos_dir = Path(config['obsidian_photos_dir'])

        if not astro_photos_dir.exists():
            log.error(f"Astro photos source not found: {astro_photos_dir}")
            sys.exit(1)

        obsidian_photos_dir.mkdir(parents=True, exist_ok=True)

        photo_folders = [
            d for d in astro_photos_dir.iterdir()
            if d.is_dir() and (d / 'index.md').exists()
        ]

        if photo_folders:
            log.step(f"Exporting {len(photo_folders)} photo album(s)...")

            total = len(photo_folders)
            for idx, folder in enumerate(sorted(photo_folders), 1):
                try:
                    status = process_photo_export(folder, config)
                    tag = {'new': ' ', 'updated': f' {Colors.YELLOW}upd{Colors.RESET}', 'forced': f' {Colors.MAGENTA}fc{Colors.RESET}'}.get(status, '')
                    log.success(f"[{idx}/{total}]{tag} {folder.name}")
                    if status == 'new':
                        stats['photo_new'] += 1
                    elif status == 'updated':
                        stats['photo_updated'] += 1
                    elif status == 'forced':
                        stats['photo_forced'] += 1

                except SkipFileError as e:
                    log.dim(f"[{idx}/{total}]   {folder.name}  (unchanged)")
                    stats['skipped'] += 1
                except Exception as e:
                    log.error(f"Export failed: {folder.name} - {str(e)}")
                    sys.exit(1)
            print()

    # Summary
    total_blog = stats['blog_new'] + stats['blog_updated'] + stats['blog_forced']
    total_photo = stats['photo_new'] + stats['photo_updated'] + stats['photo_forced']
    total_processed = total_blog + total_photo

    if total_processed > 0:
        parts = []
        if total_blog > 0:
            b = []
            if stats['blog_new']: b.append(f"{stats['blog_new']} new")
            if stats['blog_updated']: b.append(f"{stats['blog_updated']} upd")
            if stats['blog_forced']: b.append(f"{stats['blog_forced']} fc")
            parts.append(f"Blog: {', '.join(b)}")
        if total_photo > 0:
            p = []
            if stats['photo_new']: p.append(f"{stats['photo_new']} new")
            if stats['photo_updated']: p.append(f"{stats['photo_updated']} upd")
            if stats['photo_forced']: p.append(f"{stats['photo_forced']} fc")
            parts.append(f"Photo: {', '.join(p)}")
        skip_note = f"  ({stats['skipped']} skipped)" if stats['skipped'] > 0 else ""
        print()
        log.success(f"Done  {' | '.join(parts)}{skip_note}")
    else:
        if stats['skipped'] > 0:
            log.info(f"All files up to date ({stats['skipped']} unchanged)")
        else:
            log.warn("No files found to export")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print()
        log.error("Export interrupted by user")
        sys.exit(1)
    except Exception as e:
        log.error(f"Fatal error: {str(e)}")
        sys.exit(1)

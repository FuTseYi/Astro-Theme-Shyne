#!/usr/bin/env python3
"""
Obsidian to Astro Content Importer - Pure Python (No Dependencies)

Imports markdown files from Obsidian vault to Astro blog or photos format.
Supports importing blogs, photos, or both from separate source directories.
Intelligently handles incremental updates by comparing file modification times.
Stops immediately on any error (missing images, validation failures, etc.)

Usage:
    python .\scripts\import_obsidian.py

Environment variables (.env):
    IMPORT_TYPE                  - Import type: "blog", "photos", or "all"
    IMPORT_MODE                  - Import mode: "update" (default), "force", or "skip"
                                   • update: Import new files and update modified files
                                   • force:  Force overwrite all existing files
                                   • skip:   Only import new files, skip existing ones
    
    SOURCE_BLOG_DIR              - Blog markdown files directory (required for blog/all)
    SOURCE_BLOG_ATTACHMENT_DIR   - Blog attachments directory (required for blog/all)
    TARGET_BLOG_DIR              - Target directory for blog posts (required for blog/all)
    
    SOURCE_PHOTOS_DIR            - Photos markdown files directory (required for photos/all)
    SOURCE_PHOTOS_ATTACHMENT_DIR - Photos attachments directory (required for photos/all)
    TARGET_PHOTOS_DIR            - Target directory for photos (required for photos/all)
    
Content Type Detection:
    - Blog: Files with 'date' field in frontmatter
    - Photo: Files with 'startDate' field in frontmatter

Output Structure:
    Both blogs and photos are output as: {folder-name}/index.md
    - Blog: target_blog_dir/{sanitized-filename}/index.md
    - Photo: target_photos_dir/{sanitized-filename}/index.md
    - Images copied to: {folder}/assets/
    
Update Logic (IMPORT_MODE="update"):
    Compares modification time of source and target files:
    - Source newer than target → Re-import (update)
    - Source older or same → Skip (unchanged)
    - Target doesn't exist → Import (new)

Round-Trip Workflow (when Obsidian source was deleted but blog still exists):
    1. python scripts/export_to_obsidian.py   # Export blog back to Obsidian vault
    2. Edit in Obsidian
    3. python scripts/import_obsidian.py       # Re-import to blog
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
    
    # Standard colors
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    RED = '\033[31m'
    CYAN = '\033[36m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    
    # Bright colors
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
        """Only printed when VERBOSE=true"""
        if self.verbose_enabled:
            print(f"{Colors.DIM}    {msg}{Colors.RESET}")

    def step(self, msg: str):
        """Step indicator for major operations"""
        print(f"\n{Colors.BOLD}{Colors.BRIGHT_CYAN}{msg}{Colors.RESET}")

    def header(self, msg: str):
        """Header for sections (less intrusive)"""
        print(f"\n{Colors.BOLD}{Colors.BRIGHT_WHITE}{msg}{Colors.RESET}")

    def dim(self, msg: str):
        """Dimmed text for secondary info"""
        print(f"{Colors.DIM}  {msg}{Colors.RESET}")


log = Logger()


# ============================================================================
# CUSTOM EXCEPTIONS
# ============================================================================

class ImageNotFoundError(Exception):
    """Raised when a referenced image cannot be found"""
    pass

class ValidationError(Exception):
    """Raised when frontmatter validation fails"""
    pass

class SkipFileError(Exception):
    """Raised when a file should be skipped"""
    pass


# ============================================================================
# YAML PARSER (MINIMAL, NO DEPENDENCIES)
# ============================================================================

def parse_yaml_value(value: str):
    """Parse a simple YAML value (string, number, boolean, list)"""
    value = value.strip()
    
    # Boolean
    if value.lower() in ('true', 'yes', 'on'):
        return True
    if value.lower() in ('false', 'no', 'off'):
        return False
    
    # Null
    if value.lower() in ('null', 'none', '~', ''):
        return None
    
    # Number
    try:
        if '.' in value:
            return float(value)
        return int(value)
    except ValueError:
        pass
    
    # Unquote strings
    if (value.startswith('"') and value.endswith('"')) or \
       (value.startswith("'") and value.endswith("'")):
        value = value[1:-1]

    # Decode common escaped newlines produced by some Obsidian/frontmatter workflows.
    # Example: "line1\r line2" -> "line1\nline2"
    if isinstance(value, str):
        value = value.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\\r', '\n')

    return value


def parse_simple_yaml(text: str) -> Dict:
    """
    Parse simple YAML frontmatter (supports strings, numbers, booleans, simple lists)
    Does NOT support nested objects or complex YAML features.
    """
    result = {}
    lines = text.strip().split('\n')
    current_key = None
    current_list = []
    
    for line in lines:
        # List item
        if line.strip().startswith('- '):
            item = line.strip()[2:].strip()
            current_list.append(parse_yaml_value(item))
            continue
        
        # Key-value pair
        if ':' in line and not line.strip().startswith('#'):
            # Save previous list if exists
            if current_key and current_list:
                result[current_key] = current_list
                current_list = []
            
            key, _, value = line.partition(':')
            key = key.strip()
            value = value.strip()
            
            if value:  # Has value on same line
                result[key] = parse_yaml_value(value)
                current_key = None
            else:  # Value might be on next lines (list)
                current_key = key
    
    # Save last list if exists
    if current_key and current_list:
        result[current_key] = current_list
    
    return result


def parse_frontmatter(content: str) -> Tuple[Dict, str]:
    """
    Extract and parse YAML frontmatter from markdown content.
    Returns: (frontmatter_dict, body_content)
    """
    # Match frontmatter between --- delimiters
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
    # Meta fields are typically single-line in frontmatter for SEO/tooling compatibility.
    fold_to_single_line_keys = {'description', 'summary', 'excerpt'}
    
    for key, value in fm.items():
        if isinstance(value, list):
            lines.append(f'{key}:')
            for item in value:
                lines.append(f'  - {item}')
        elif isinstance(value, bool):
            lines.append(f'{key}: {str(value).lower()}')
        elif isinstance(value, str):
            # Normalize escaped CR/LF sequences to real line breaks.
            value = value.replace('\r\n', '\n').replace('\r', '\n')

            # Industry-common output: keep metadata descriptions as a single line.
            if key in fold_to_single_line_keys:
                value = re.sub(r'\s*\n\s*', ' ', value).strip()

            # Collapse consecutive spaces for cleaner meta text.
            if key in fold_to_single_line_keys:
                value = re.sub(r'\s{2,}', ' ', value)

            # Emit multiline strings using YAML block scalar to preserve formatting.
            if '\n' in value:
                lines.append(f'{key}: |')
                for line in value.split('\n'):
                    lines.append(f'  {line}')
                continue

            # Quote strings with special characters
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
    """Check if file is a markdown file"""
    return filename.endswith('.md')


def get_basename(filepath: str) -> str:
    """Get basename without extension"""
    return Path(filepath).stem


def to_safe_folder_name(name: str) -> str:
    """Convert name to filesystem-safe folder name"""
    return re.sub(r'[<>:"/\\|?*\x00-\x1F]', '-', name).strip()


def normalize_image_name(image_name: str) -> str:
    """Normalize image filename: fully lowercase, replace spaces with hyphens"""
    path = Path(image_name)
    stem = path.stem.lower().replace(' ', '-')
    ext = path.suffix.lower()
    return f"{stem}{ext}"


def should_import_file(source_file: Path, target_file: Path, mode: str) -> Tuple[bool, str]:
    """
    Determine if a file should be imported based on import mode.

    update mode uses file modification time (mtime). This is the correct
    approach because import always transforms content (frontmatter, image
    syntax, date formatting), so source and target will never be byte-identical.
    mtime reliably answers: "was the source edited since last import?"
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


# ============================================================================
# VALIDATION UTILITIES
# ============================================================================

def validate_frontmatter(fm: Dict, filename: str):
    """Validate blog frontmatter fields, raise ValidationError if invalid"""
    issues = []

    # description is optional, but validate type if present
    if fm.get('description') is not None and not isinstance(fm.get('description'), str):
        issues.append('description (invalid type, expected string)')

    if not fm.get('date'):
        issues.append('date (missing)')
    else:
        try:
            date_str = str(fm['date'])
            # Try parsing common date formats
            for fmt in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                try:
                    datetime.strptime(date_str.split('.')[0].split('+')[0].strip(), fmt)
                    break
                except ValueError:
                    continue
            else:
                issues.append(f"date (invalid: \"{fm['date']}\")")
        except:
            issues.append(f"date (invalid: \"{fm['date']}\")")

    if issues:
        raise ValidationError(f"[{filename}] frontmatter validation failed: {', '.join(issues)}")


def validate_photo_frontmatter(fm: Dict, filename: str):
    """Validate photo frontmatter fields, raise ValidationError if invalid"""
    issues = []

    # description is optional, but validate type if present
    if fm.get('description') is not None and not isinstance(fm.get('description'), str):
        issues.append('description (invalid type, expected string)')

    if not fm.get('startDate'):
        issues.append('startDate (missing)')
    else:
        try:
            date_str = str(fm['startDate'])
            # Try parsing common date formats
            for fmt in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                try:
                    datetime.strptime(date_str.split('.')[0].split('+')[0].strip(), fmt)
                    break
                except ValueError:
                    continue
            else:
                issues.append(f"startDate (invalid: \"{fm['startDate']}\")")
        except:
            issues.append(f"startDate (invalid: \"{fm['startDate']}\")")

    # endDate is optional, but validate if present
    if fm.get('endDate'):
        try:
            date_str = str(fm['endDate'])
            for fmt in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                try:
                    datetime.strptime(date_str.split('.')[0].split('+')[0].strip(), fmt)
                    break
                except ValueError:
                    continue
            else:
                issues.append(f"endDate (invalid: \"{fm['endDate']}\")")
        except:
            issues.append(f"endDate (invalid: \"{fm['endDate']}\")")

    if issues:
        raise ValidationError(f"[{filename}] photo frontmatter validation failed: {', '.join(issues)}")


def check_skip_reason(fm: Dict, filename: str):
    """Check if blog should be skipped, raise SkipFileError if should skip"""
    can_skip = fm.get('can_skip')
    if can_skip is True or (isinstance(can_skip, str) and can_skip.lower() == 'true'):
        raise SkipFileError(f"[{filename}] can_skip property is set to true")

    # Support both 'draft' (Astro convention) and 'is_draft' (Obsidian convention)
    is_draft = fm.get('draft') or fm.get('is_draft')
    if is_draft is True or (isinstance(is_draft, str) and is_draft.lower() == 'true'):
        raise SkipFileError(f"[{filename}] post is marked as draft")


# ============================================================================
# FRONTMATTER UTILITIES
# ============================================================================

def normalize_obsidian_array(value) -> List:
    """Normalize Obsidian format value to array"""
    if isinstance(value, list):
        return value
    if value and isinstance(value, str):
        return [value]
    return []


def parse_obsidian_frontmatter(fm: Dict, filename: str) -> Dict:
    """Parse Obsidian frontmatter to Astro format"""
    basename = get_basename(filename)

    # TITLE: use existing or fallback to filename
    if not fm.get('title') or not isinstance(fm.get('title'), str) or not str(fm['title']).strip():
        fm['title'] = basename

    # TAGS: normalize from Obsidian format (#tag → tag)
    fm['tags'] = normalize_obsidian_array(fm.get('tags', []))
    if isinstance(fm['tags'], list):
        fm['tags'] = [
            tag[1:] if isinstance(tag, str) and tag.startswith('#') else tag
            for tag in fm['tags']
        ]

    # DRAFT: normalize is_draft → draft (Obsidian convention → Astro convention)
    if 'is_draft' in fm and 'draft' not in fm:
        fm['draft'] = fm.pop('is_draft')
    elif 'is_draft' in fm:
        fm.pop('is_draft')  # both exist, keep draft

    # DESCRIPTION: collapse multi-line Obsidian descriptions for SEO meta
    if fm.get('description') and isinstance(fm.get('description'), str):
        fm['description'] = re.sub(r'\s+', ' ', fm['description']).strip()

    return fm


# ============================================================================
# IMAGE PROCESSING UTILITIES
# ============================================================================

# Regex patterns
OBSIDIAN_IMAGE_REGEX = re.compile(r'!\[\[([^\]]+)\]\]')
OBSIDIAN_IMAGE_FULL_REGEX = re.compile(r'^\s*!\[\[([^\]]+)\]\]\s*$')
MARKDOWN_IMAGE_REGEX = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')
MARKDOWN_IMAGE_FULL_REGEX = re.compile(r'^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$')


def is_remote_url(url: str) -> bool:
    """Check if URL is remote"""
    s = url.strip().lower()
    return s.startswith(('http://', 'https://', 'data:', 'mailto:'))


def is_file_path(value: str) -> bool:
    """
    Check if a string is a file path (vs emoji or plain text).
    Returns True if it looks like a file path.
    """
    if not value or not isinstance(value, str):
        return False
    
    value = value.strip()
    
    # Already processed path
    if value.startswith('./') or value.startswith('assets/'):
        return False
    
    # Has file extension (common image formats)
    if re.search(r'\.(png|jpe?g|gif|svg|webp|ico|bmp)$', value, re.IGNORECASE):
        return True
    
    # Has path separators
    if '/' in value or '\\' in value:
        return True
    
    # Very short strings (1-3 chars) are likely emoji/text, not paths
    if len(value) <= 3:
        return False
    
    # Contains dots but not as extension (like "my.image" without extension)
    # This is ambiguous, but if no clear extension, treat as text
    return False


def parse_markdown_paren_content(content: str) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Parse markdown image parenthesis content: (url "title")
    Returns: (url, title, raw_title_with_quotes)
    """
    raw = content.strip()

    # Remove surrounding <...>
    if raw.startswith('<'):
        close = raw.find('>')
        if close != -1:
            inside = raw[1:close].strip()
            rest = raw[close + 1:].strip()
            raw = inside + (' ' + rest if rest else '')

    # Extract optional title (last quoted segment)
    title_match = re.search(r'\s+(["' + "'])(.*?)\\1\\s*$", raw)
    if title_match:
        raw_title = title_match.group(0).strip()
        url = raw[:len(raw) - len(title_match.group(0))].strip()
        return url, title_match.group(2), raw_title

    return raw.strip(), None, None


def resolve_source_image_path(source_dir: Path, referenced_path: str, filename: str) -> Tuple[Path, str]:
    """
    Try resolving a referenced image to a real file in source_dir.
    Uses case-insensitive fallback for cross-platform compatibility.
    Returns: (resolved_path, actual_filename_from_disk)
    Raises: ImageNotFoundError if not found
    """
    if not referenced_path:
        raise ImageNotFoundError(f"[{filename}] empty image reference")

    ref = referenced_path.strip()

    # Decode URL encoding
    try:
        ref = unquote(ref)
    except:
        pass

    # Remove leading ./
    ref = re.sub(r'^(\.\/)+', '', ref)

    # Prevent path traversal
    normalized = Path(ref).as_posix()
    paths_to_try = []

    if not normalized.startswith('..'):
        paths_to_try.append(source_dir / ref)

    base = Path(ref).name
    if base and base != ref:
        paths_to_try.append(source_dir / base)

    # Phase 1: exact match
    for path in paths_to_try:
        if path.exists() and path.is_file():
            return path, path.name

    # Phase 2: case-insensitive fallback (critical for Linux/macOS)
    search_dir = paths_to_try[-1].parent if paths_to_try else source_dir
    if search_dir.exists() and search_dir.is_dir():
        target_lower = base.lower() if base else Path(ref).name.lower()
        for entry in search_dir.iterdir():
            if entry.is_file() and entry.name.lower() == target_lower:
                return entry, entry.name

    # Not found
    raise ImageNotFoundError(f"[{filename}] image not found: {referenced_path} (searched in: {source_dir})")


def copy_image(source_path: Path, dest_path: Path, filename: str):
    """Copy a single image file, raise exception on failure"""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, dest_path)


def process_banner_image(fm: Dict, source_dir: Path, dest_dir: Path, filename: str) -> int:
    """Process banner image in frontmatter. Returns: 1 if processed, 0 if skipped."""
    raw_value = fm.get('banner')
    if not isinstance(raw_value, str):
        return 0

    assets_dir = dest_dir / 'assets'
    referenced = None

    # Try Obsidian format
    obs_match = OBSIDIAN_IMAGE_FULL_REGEX.match(raw_value)
    if obs_match:
        referenced = obs_match.group(1).strip()
    else:
        # Try Markdown format
        md_match = MARKDOWN_IMAGE_FULL_REGEX.match(raw_value)
        if md_match:
            url, _, _ = parse_markdown_paren_content(md_match.group(2))
            referenced = url.strip() if url else None

    if not referenced or is_remote_url(referenced):
        return 0

    assets_dir.mkdir(parents=True, exist_ok=True)

    # Will raise ImageNotFoundError if not found
    source_path, display_name = resolve_source_image_path(source_dir, referenced, filename)
    normalized_name = normalize_image_name(Path(display_name).name)
    dest_path = assets_dir / normalized_name

    copy_image(source_path, dest_path, filename)
    log.verbose(f"banner: {display_name}")

    # Rewrite frontmatter
    fm['image'] = f"./assets/{normalized_name}"
    fm.pop('banner', None)
    return 1


def process_images(content: str, source_dir: Path, dest_dir: Path, filename: str) -> Tuple[str, int]:
    """
    Process all images in markdown content.
    Returns: (updated_content, image_count)
    """
    assets_dir = dest_dir / 'assets'
    assets_dir.mkdir(parents=True, exist_ok=True)

    # Find all images
    obs_matches = list(OBSIDIAN_IMAGE_REGEX.finditer(content))
    md_matches = list(MARKDOWN_IMAGE_REGEX.finditer(content))

    if not obs_matches and not md_matches:
        return content, 0

    # Deduplicate copy tasks
    copy_plan = {}
    updated_content = content

    # Process Obsidian embeds
    for match in obs_matches:
        referenced = match.group(1).strip()
        if not referenced or is_remote_url(referenced):
            continue

        if referenced not in copy_plan:
            # Will raise ImageNotFoundError if not found
            source_path, display_name = resolve_source_image_path(source_dir, referenced, filename)
            normalized_name = normalize_image_name(Path(display_name).name)
            dest_path = assets_dir / normalized_name

            copy_image(source_path, dest_path, filename)
            log.verbose(f"image: {display_name}")

            copy_plan[referenced] = normalized_name

        # Replace in content (empty alt text — Obsidian embeds carry no alt)
        normalized_name = copy_plan[referenced]
        updated_content = updated_content.replace(
            match.group(0),
            f"![](./assets/{normalized_name})"
        )

    # Process Markdown images
    for match in md_matches:
        alt_text = match.group(1)
        paren = match.group(2)
        url, _, raw_title = parse_markdown_paren_content(paren)
        referenced = url.strip() if url else ''

        if not referenced or is_remote_url(referenced):
            continue

        if referenced not in copy_plan:
            # Will raise ImageNotFoundError if not found
            source_path, display_name = resolve_source_image_path(source_dir, referenced, filename)
            normalized_name = normalize_image_name(Path(display_name).name)
            dest_path = assets_dir / normalized_name

            copy_image(source_path, dest_path, filename)
            log.verbose(f"image: {display_name}")

            copy_plan[referenced] = normalized_name

        # Replace in content
        normalized_name = copy_plan[referenced]
        title_part = f' {raw_title}' if raw_title else ''
        updated_content = updated_content.replace(
            match.group(0),
            f"![{alt_text}](./assets/{normalized_name}{title_part})"
        )

    return updated_content, len(copy_plan)


# ============================================================================
# MARKDOWN UTILITIES
# ============================================================================

def format_date(date) -> str:
    """Format date to YYYY-MM-DD"""
    if isinstance(date, datetime):
        return date.strftime('%Y-%m-%d')
    if isinstance(date, str):
        try:
            # Try parsing and reformatting
            for fmt in ['%Y-%m-%d', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                try:
                    dt = datetime.strptime(date.split('.')[0].split('+')[0].strip(), fmt)
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        except:
            pass
    return str(date)


def build_markdown_content(body: str, fm: Dict) -> str:
    """Build markdown content with formatted frontmatter"""
    formatted = fm.copy()

    # Normalize all date fields (blog uses 'date', photos use 'startDate'/'endDate')
    for key in ('date', 'startDate', 'endDate'):
        if formatted.get(key):
            formatted[key] = format_date(formatted[key])

    frontmatter_text = build_frontmatter_text(formatted)
    return f"{frontmatter_text}\n\n{body}"


# ============================================================================
# NOTE PROCESSING
# ============================================================================

def process_note(filepath: Path, config: Dict):
    """
    Process a single Obsidian blog note file.
    Raises exceptions on any error (will stop execution immediately)
    Returns: 'new', 'updated', or None (if skipped)
    """
    filename = filepath.name

    # Read file
    content = filepath.read_text(encoding='utf-8')
    fm, body = parse_frontmatter(content)

    # Check skip reason (raises SkipFileError)
    check_skip_reason(fm, filename)

    # Validate frontmatter (raises ValidationError)
    validate_frontmatter(fm, filename)

    # Create destination directory (use original filename without extension)
    folder_name = to_safe_folder_name(get_basename(str(filepath)))
    dest_dir = Path(config['target_blog_dir']) / folder_name
    output_path = dest_dir / 'index.md'
    
    # Check if should import
    should_import, reason = should_import_file(filepath, output_path, config['import_mode'])
    
    if not should_import:
        raise SkipFileError(f"[{filename}] {reason}")
    
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Clear existing assets directory to remove orphaned images
    assets_dir = dest_dir / 'assets'
    if assets_dir.exists() and assets_dir.is_dir():
        shutil.rmtree(assets_dir)

    # Process frontmatter
    processed_fm = parse_obsidian_frontmatter(fm, str(filepath))

    # Process banner image (raises ImageNotFoundError if missing)
    img_count = process_banner_image(
        processed_fm,
        Path(config['source_blog_attachment_dir']),
        dest_dir,
        filename
    )

    # Process content images (raises ImageNotFoundError if any missing)
    updated_content, body_img_count = process_images(
        body,
        Path(config['source_blog_attachment_dir']),
        dest_dir,
        filename
    )
    img_count += body_img_count

    # Write markdown file
    final_content = build_markdown_content(updated_content, processed_fm)
    output_path.write_text(final_content, encoding='utf-8')

    return reason, img_count


def process_photo(filepath: Path, config: Dict):
    """
    Process a single Obsidian photo file.
    Raises exceptions on any error (will stop execution immediately)
    Returns: 'new', 'updated', or None (if skipped)
    """
    filename = filepath.name

    # Read file
    content = filepath.read_text(encoding='utf-8')
    fm, body = parse_frontmatter(content)

    # Check skip reason (raises SkipFileError)
    check_skip_reason(fm, filename)

    # Validate photo frontmatter (raises ValidationError)
    validate_photo_frontmatter(fm, filename)

    # Create destination directory (use original filename without extension)
    folder_name = to_safe_folder_name(get_basename(str(filepath)))
    dest_dir = Path(config['target_photos_dir']) / folder_name
    output_path = dest_dir / 'index.md'
    
    # Check if should import
    should_import, reason = should_import_file(filepath, output_path, config['import_mode'])
    
    if not should_import:
        raise SkipFileError(f"[{filename}] {reason}")
    
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Clear existing assets directory to remove orphaned images
    assets_dir = dest_dir / 'assets'
    if assets_dir.exists() and assets_dir.is_dir():
        shutil.rmtree(assets_dir)

    # Process frontmatter (title is required for photos)
    processed_fm = fm.copy()
    if not processed_fm.get('title') or not isinstance(processed_fm.get('title'), str) or not str(processed_fm['title']).strip():
        processed_fm['title'] = get_basename(filename)

    img_count = 0

    # Process favicon image if present
    if processed_fm.get('favicon'):
        favicon_value = processed_fm['favicon']

        # Only process if it's a file path (not emoji or plain text)
        if is_file_path(favicon_value) and not is_remote_url(favicon_value):
            # Try to find and normalize the favicon image
            try:
                source_path, display_name = resolve_source_image_path(
                    Path(config['source_photos_attachment_dir']),
                    favicon_value,
                    filename
                )
                assets_dir = dest_dir / 'assets'
                assets_dir.mkdir(parents=True, exist_ok=True)
                normalized_name = normalize_image_name(Path(display_name).name)
                dest_path = assets_dir / normalized_name
                copy_image(source_path, dest_path, filename)
                processed_fm['favicon'] = f"./assets/{normalized_name}"
                log.verbose(f"favicon: {display_name}")
                img_count += 1
            except ImageNotFoundError:
                # If favicon image not found, keep original value and warn
                log.warn(f"Favicon image not found: {favicon_value} (in {filename}), keeping original value")
        # else: favicon is emoji/text or remote URL, keep as-is

    # Process content images (raises ImageNotFoundError if any missing)
    updated_content, body_img_count = process_images(
        body,
        Path(config['source_photos_attachment_dir']),
        dest_dir,
        filename
    )
    img_count += body_img_count

    # Write markdown file
    final_content = build_markdown_content(updated_content, processed_fm)
    output_path.write_text(final_content, encoding='utf-8')

    return reason, img_count


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
                
                # Remove surrounding quotes (both single and double)
                if (value.startswith('"') and value.endswith('"')) or \
                   (value.startswith("'") and value.endswith("'")):
                    value = value[1:-1]
                
                os.environ[key] = value


def validate_environment():
    """Validate required environment variables"""
    # Validate IMPORT_TYPE
    import_type = os.getenv('IMPORT_TYPE', '').lower()
    if not import_type:
        raise ValueError("IMPORT_TYPE is required")
    if import_type not in ['blog', 'photos', 'all']:
        raise ValueError(f"IMPORT_TYPE must be 'blog', 'photos', or 'all', got: {import_type}")
    
    # Validate IMPORT_MODE
    import_mode = os.getenv('IMPORT_MODE', 'update').lower()
    if import_mode not in ['update', 'force', 'skip']:
        raise ValueError(f"IMPORT_MODE must be 'update', 'force', or 'skip', got: {import_mode}")
    
    # Validate blog-related variables
    if import_type in ['blog', 'all']:
        blog_required = ['SOURCE_BLOG_DIR', 'SOURCE_BLOG_ATTACHMENT_DIR', 'TARGET_BLOG_DIR']
        missing = [key for key in blog_required if not os.getenv(key)]
        if missing:
            raise ValueError(f"missing required blog variables: {', '.join(missing)}")
    
    # Validate photos-related variables
    if import_type in ['photos', 'all']:
        photos_required = ['SOURCE_PHOTOS_DIR', 'SOURCE_PHOTOS_ATTACHMENT_DIR', 'TARGET_PHOTOS_DIR']
        missing = [key for key in photos_required if not os.getenv(key)]
        if missing:
            raise ValueError(f"missing required photos variables: {', '.join(missing)}")


def get_env_config() -> Dict:
    """Get environment configuration"""
    return {
        'import_type': os.getenv('IMPORT_TYPE', 'blog').lower(),
        'import_mode': os.getenv('IMPORT_MODE', 'update').lower(),
        # Blog settings
        'source_blog_dir': os.getenv('SOURCE_BLOG_DIR', ''),
        'source_blog_attachment_dir': os.getenv('SOURCE_BLOG_ATTACHMENT_DIR', ''),
        'target_blog_dir': os.getenv('TARGET_BLOG_DIR', ''),
        # Photos settings
        'source_photos_dir': os.getenv('SOURCE_PHOTOS_DIR', ''),
        'source_photos_attachment_dir': os.getenv('SOURCE_PHOTOS_ATTACHMENT_DIR', ''),
        'target_photos_dir': os.getenv('TARGET_PHOTOS_DIR', ''),
    }


def main():
    """Main execution function - stops immediately on any error"""
    # Load .env file
    load_env_from_file('.env')

    # VERBOSE=1 for detailed output (image-level logs)
    verbose = os.getenv('VERBOSE', os.getenv('IMPORT_VERBOSE', '')).lower() in ('1', 'true', 'yes')
    Logger.set_verbose(verbose)

    # Validate environment
    validate_environment()
    config = get_env_config()

    import_type = config['import_type']
    import_mode = config['import_mode']
    
    # Header
    log.header(f"Obsidian → Astro  ({import_mode} · {import_type})")
    print()

    # Statistics
    stats = {
        'blog_new': 0,
        'blog_updated': 0,
        'blog_forced': 0,
        'photo_new': 0,
        'photo_updated': 0,
        'photo_forced': 0,
        'skipped': 0
    }

    # Process blog files
    if import_type in ['blog', 'all']:
        blog_source_dir = Path(config['source_blog_dir'])
        if not blog_source_dir.exists():
            log.error(f"Blog source directory not found: {blog_source_dir}")
            sys.exit(1)
        
        blog_files = [f for f in blog_source_dir.iterdir() if f.is_file() and is_markdown_file(f.name)]
        
        if blog_files:
            log.step(f"Processing {len(blog_files)} blog file(s)...")
            
            for idx, filepath in enumerate(blog_files, 1):
                try:
                    status, img_count = process_note(filepath, config)
                    tag = {'new': ' ', 'updated': f' {Colors.YELLOW}upd{Colors.RESET}', 'forced': f' {Colors.MAGENTA}fc{Colors.RESET}'}.get(status, '')
                    img_info = f' {Colors.DIM}({img_count} img){Colors.RESET}' if img_count > 0 else ''
                    log.success(f"[{idx}/{len(blog_files)}]{tag} {filepath.name}{img_info}")
                    if status == 'new':
                        stats['blog_new'] += 1
                    elif status == 'updated':
                        stats['blog_updated'] += 1
                    elif status == 'forced':
                        stats['blog_forced'] += 1

                except SkipFileError as e:
                    log.dim(f"[{idx}/{len(blog_files)}]   {filepath.name}  (unchanged)")
                    stats['skipped'] += 1
                except (ImageNotFoundError, ValidationError) as e:
                    log.error(str(e))
                    log.error(f"Import stopped at: {filepath.name}")
                    sys.exit(1)
                except Exception as e:
                    log.error(f"Unexpected error in {filepath.name}: {str(e)}")
                    sys.exit(1)
            print()

    # Process photo files
    if import_type in ['photos', 'all']:
        photos_source_dir = Path(config['source_photos_dir'])
        if not photos_source_dir.exists():
            log.error(f"Photos source directory not found: {photos_source_dir}")
            sys.exit(1)
        
        photo_files = [f for f in photos_source_dir.iterdir() if f.is_file() and is_markdown_file(f.name)]
        
        if photo_files:
            log.step(f"Processing {len(photo_files)} photo file(s)...")
            
            for idx, filepath in enumerate(photo_files, 1):
                try:
                    status, img_count = process_photo(filepath, config)
                    tag = {'new': ' ', 'updated': f' {Colors.YELLOW}upd{Colors.RESET}', 'forced': f' {Colors.MAGENTA}fc{Colors.RESET}'}.get(status, '')
                    img_info = f' {Colors.DIM}({img_count} img){Colors.RESET}' if img_count > 0 else ''
                    log.success(f"[{idx}/{len(photo_files)}]{tag} {filepath.name}{img_info}")
                    if status == 'new':
                        stats['photo_new'] += 1
                    elif status == 'updated':
                        stats['photo_updated'] += 1
                    elif status == 'forced':
                        stats['photo_forced'] += 1

                except SkipFileError as e:
                    log.dim(f"[{idx}/{len(photo_files)}]   {filepath.name}  (unchanged)")
                    stats['skipped'] += 1
                except (ImageNotFoundError, ValidationError) as e:
                    log.error(str(e))
                    log.error(f"Import stopped at: {filepath.name}")
                    sys.exit(1)
                except Exception as e:
                    log.error(f"Unexpected error in {filepath.name}: {str(e)}")
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
            log.warn("No files found to import")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print()
        log.error("Import interrupted by user")
        sys.exit(1)
    except Exception as e:
        log.error(f"Fatal error: {str(e)}")
        sys.exit(1)

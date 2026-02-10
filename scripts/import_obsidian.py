#!/usr/bin/env python3
"""
Obsidian to Astro Blog Importer - Pure Python (No Dependencies)

Imports markdown files from Obsidian vault to Astro blog format.
Stops immediately on any error (missing images, validation failures, etc.)

Usage:
    python .\scripts\import_obsidian.py

Environment variables (.env):
    SOURCE_MARKDOWN_DIR   - Obsidian markdown files directory
    SOURCE_ATTACHMENT_DIR - Obsidian attachments directory
    TARGET_DIR            - Target directory for converted files
"""

import os
import re
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Tuple
from urllib.parse import unquote


# ============================================================================
# LOGGING UTILITIES
# ============================================================================

class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    RED = '\033[31m'
    CYAN = '\033[36m'


class Logger:
    def __init__(self, name: str = ''):
        self.prefix = f'[{name}]' if name else ''

    def info(self, msg: str):
        print(f"{self.prefix} [INFO] {msg}")

    def success(self, msg: str):
        print(f"{Colors.GREEN}{self.prefix} [SUCCESS] {msg}{Colors.RESET}")

    def warn(self, msg: str):
        print(f"{Colors.YELLOW}{self.prefix} [WARN] {msg}{Colors.RESET}")

    def error(self, msg: str):
        print(f"{Colors.RED}{self.prefix} [ERROR] {msg}{Colors.RESET}")


log = Logger('import-obsidian')


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
        return value[1:-1]
    
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
    
    for key, value in fm.items():
        if isinstance(value, list):
            lines.append(f'{key}:')
            for item in value:
                lines.append(f'  - {item}')
        elif isinstance(value, bool):
            lines.append(f'{key}: {str(value).lower()}')
        elif isinstance(value, str):
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
    """Normalize image filename: lowercase basename, replace spaces with hyphens"""
    path = Path(image_name)
    normalized = path.stem.lower().replace(' ', '-')
    return f"{normalized}{path.suffix}"


# ============================================================================
# VALIDATION UTILITIES
# ============================================================================

def validate_frontmatter(fm: Dict, filename: str):
    """Validate frontmatter fields, raise ValidationError if invalid"""
    issues = []

    if not fm.get('description'):
        issues.append('description (missing)')
    elif not isinstance(fm.get('description'), str):
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


def check_skip_reason(fm: Dict, filename: str):
    """Check if blog should be skipped, raise SkipFileError if should skip"""
    can_skip = fm.get('can_skip')
    if can_skip is True or (isinstance(can_skip, str) and can_skip.lower() == 'true'):
        raise SkipFileError(f"[{filename}] can_skip property is set to true")
    
    is_draft = fm.get('is_draft')
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
    Returns: (resolved_path, display_name)
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
    tries = []

    if not normalized.startswith('..'):
        tries.append((source_dir / ref, ref))

    base = Path(ref).name
    if base and base != ref:
        tries.append((source_dir / base, base))

    for path, display in tries:
        if path.exists() and path.is_file():
            return path, display

    # Not found - raise error
    raise ImageNotFoundError(f"[{filename}] image not found: {referenced_path} (searched in: {source_dir})")


def copy_image(source_path: Path, dest_path: Path, filename: str):
    """Copy a single image file, raise exception on failure"""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, dest_path)


def process_banner_image(fm: Dict, source_dir: Path, dest_dir: Path, filename: str):
    """
    Process banner image in frontmatter.
    Supports: banner: "![[image.png]]" or banner: "![alt](image.png)"
    Raises ImageNotFoundError if image not found
    """
    raw_value = fm.get('banner')
    if not isinstance(raw_value, str):
        return

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
        return

    assets_dir.mkdir(parents=True, exist_ok=True)

    # Will raise ImageNotFoundError if not found
    source_path, display_name = resolve_source_image_path(source_dir, referenced, filename)
    normalized_name = normalize_image_name(Path(display_name).name)
    dest_path = assets_dir / normalized_name

    copy_image(source_path, dest_path, filename)
    log.info(f"copied banner image: {display_name} → assets/{normalized_name}")

    # Rewrite frontmatter
    fm['image'] = f"./assets/{normalized_name}"
    fm.pop('banner', None)


def process_images(content: str, source_dir: Path, dest_dir: Path, filename: str) -> str:
    """
    Process all images in markdown content.
    Supports both ![[image.png]] and ![alt](image.png "title")
    Raises ImageNotFoundError if any image not found
    Returns: updated content
    """
    assets_dir = dest_dir / 'assets'
    assets_dir.mkdir(parents=True, exist_ok=True)

    # Find all images
    obs_matches = list(OBSIDIAN_IMAGE_REGEX.finditer(content))
    md_matches = list(MARKDOWN_IMAGE_REGEX.finditer(content))

    if not obs_matches and not md_matches:
        return content

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
            log.info(f"copied image: {display_name} → assets/{normalized_name}")

            copy_plan[referenced] = normalized_name

        # Replace in content
        normalized_name = copy_plan[referenced]
        alt = Path(normalized_name).stem
        updated_content = updated_content.replace(
            match.group(0),
            f"![{alt}](./assets/{normalized_name})"
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
            log.info(f"copied image: {display_name} → assets/{normalized_name}")

            copy_plan[referenced] = normalized_name

        # Replace in content
        normalized_name = copy_plan[referenced]
        title_part = f' {raw_title}' if raw_title else ''
        updated_content = updated_content.replace(
            match.group(0),
            f"![{alt_text}](./assets/{normalized_name}{title_part})"
        )

    return updated_content


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
    if 'date' in formatted:
        formatted['date'] = format_date(formatted['date'])

    frontmatter_text = build_frontmatter_text(formatted)
    return f"{frontmatter_text}\n\n{body}"


# ============================================================================
# NOTE PROCESSING
# ============================================================================

def process_note(filepath: Path, config: Dict):
    """
    Process a single Obsidian note file.
    Raises exceptions on any error (will stop execution immediately)
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
    dest_dir = Path(config['target_dir']) / folder_name
    dest_dir.mkdir(parents=True, exist_ok=True)

    # Process frontmatter
    processed_fm = parse_obsidian_frontmatter(fm, str(filepath))

    # Process banner image (raises ImageNotFoundError if missing)
    process_banner_image(
        processed_fm,
        Path(config['source_attachment_dir']),
        dest_dir,
        filename
    )

    # Process content images (raises ImageNotFoundError if any missing)
    updated_content = process_images(
        body,
        Path(config['source_attachment_dir']),
        dest_dir,
        filename
    )

    # Write markdown file
    final_content = build_markdown_content(updated_content, processed_fm)
    output_path = dest_dir / 'index.md'
    output_path.write_text(final_content, encoding='utf-8')

    log.success(f"imported: '{filename}' → '{folder_name}/index.md'")


# ============================================================================
# ENVIRONMENT & MAIN
# ============================================================================

def load_env_from_file(env_path: str = '.env'):
    """Simple .env file loader with quote handling"""
    if not os.path.exists(env_path):
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
    required = ['SOURCE_MARKDOWN_DIR', 'SOURCE_ATTACHMENT_DIR', 'TARGET_DIR']
    missing = [key for key in required if not os.getenv(key)]

    if missing:
        raise ValueError(f"missing required environment variables: {', '.join(missing)}")


def get_env_config() -> Dict:
    """Get environment configuration"""
    return {
        'source_markdown_dir': os.getenv('SOURCE_MARKDOWN_DIR'),
        'source_attachment_dir': os.getenv('SOURCE_ATTACHMENT_DIR'),
        'target_dir': os.getenv('TARGET_DIR'),
    }


def main():
    """Main execution function - stops immediately on any error"""
    # Load .env file
    load_env_from_file('.env')

    # Validate environment
    validate_environment()
    config = get_env_config()

    log.info('starting import: obsidian → astro markdown blog')
    log.info('mode: FAIL-FAST (stops on first error)')

    # Get markdown files
    source_dir = Path(config['source_markdown_dir'])
    if not source_dir.exists():
        log.error(f"source directory does not exist: {source_dir}")
        exit(1)

    markdown_files = [f for f in source_dir.iterdir() if f.is_file() and is_markdown_file(f.name)]

    if not markdown_files:
        log.warn('no markdown files found in source directory')
        return

    log.info(f"found {len(markdown_files)} markdown file(s)")

    # Process files sequentially - stop on first error
    imported_count = 0
    skipped_count = 0

    for filepath in markdown_files:
        try:
            process_note(filepath, config)
            imported_count += 1
        except SkipFileError as e:
            log.warn(str(e))
            skipped_count += 1
        except (ImageNotFoundError, ValidationError) as e:
            log.error(str(e))
            log.error(f"import stopped due to error in: {filepath.name}")
            exit(1)
        except Exception as e:
            log.error(f"unexpected error processing {filepath.name}: {str(e)}")
            exit(1)

    log.success(f"import completed successfully: {imported_count} imported, {skipped_count} skipped")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log.error("\nimport interrupted by user")
        exit(1)
    except Exception as e:
        log.error(f"fatal error: {str(e)}")
        exit(1)

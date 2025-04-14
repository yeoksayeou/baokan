#!/usr/bin/env python3

import os
import re
import sys
from pathlib import Path
import json # To safely embed data into HTML/JS

# --- Natural Sorting Helper ---

def natural_sort_key(s, _nsre=re.compile('([0-9]+)')):
    """Key for natural sorting (e.g., file1, file2, file10)."""
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split(_nsre, str(s))]

# --- CSS Content ---

# Updated CSS content - Ensure this matches articles-styles.css
# Reflects changes for button styling and floating container backgrounds
CSS_CONTENT = """
:root {
    /* Color Palette Inspired by index-styles.css */
    --primary-color: #1e472e;
    --secondary-color: #363e35;
    --accent-color: #3c5244;
    --border-color-inspired: #a3b8a4;
    --link-color-inspired: #2a4b30;
    --link-hover-color-inspired: #436542;
    --button-text-color: white;

    /* Original Variables */
    --chinese-font: 'Noto Serif TC', serif;
    --english-font: Georgia, serif;
    --border-color: #ccc;
    --control-bg: #f0f0f0e0;
    --pane-padding: 15px;
    --control-area-padding: 60px;
}
html { height: 100%; }
body {
    font-family: sans-serif; margin: 0;
    padding-top: var(--control-area-padding);
    padding-bottom: calc(var(--control-area-padding) / 2);
    box-sizing: border-box;
    height: 100%;
}
.controls {
    position: fixed; top: 10px; left: 10px;
    display: flex; gap: 8px; align-items: center;
    z-index: 10;
}
.controls button {
    padding: 5px 10px; cursor: pointer;
    background-color: var(--accent-color);
    color: var(--button-text-color);
    border: 1px solid var(--accent-color);
    border-radius: 5px;
    transition: background-color 0.2s ease;
}
.controls button:hover {
    background-color: var(--link-hover-color-inspired);
    border-color: var(--link-hover-color-inspired);
}
.container {
    display: flex; height: 100%; width: 100%;
    overflow: hidden; box-sizing: border-box;
}
.pane {
    border: 1px solid transparent;
    padding: var(--pane-padding);
    overflow-y: auto; box-sizing: border-box;
}
.pane .article-title {
    font-size: 1.1em; font-weight: bold; color: #555;
    margin-top: 0; margin-bottom: 1em;
    border-bottom: 1px solid #eee; padding-bottom: 0.5em;
}
#content-t h1 {
    font-family: var(--english-font); font-size: 1.5em; font-weight: bold;
    color: #333; margin-top: 0; margin-bottom: 0.8em;
    padding-bottom: 0; border-bottom: none;
}
.pane h2, .pane h3 { margin-top: 0.5em; margin-bottom: 0.5em; }
#content-base { font-family: var(--chinese-font); }
#content-t { font-family: var(--english-font); }
#content-base h3 { font-size: 1.3em; }
body.view-hsplit .container { flex-direction: row; }
body.view-hsplit .pane { width: 50%; height: 100%; border-color: transparent; }
body.view-hsplit #content-base { border-right: 1px solid var(--border-color); display: block !important; }
body.view-hsplit #content-t { display: block !important; }
body.view-hsplit .toggle-language-btn { display: none; }
body.view-vsplit .container { flex-direction: column; }
body.view-vsplit .pane { width: 100%; height: 50%; border-color: transparent; }
body.view-vsplit #content-base { border-bottom: 1px solid var(--border-color); display: block !important; }
body.view-vsplit #content-t { display: block !important; }
body.view-vsplit .toggle-language-btn { display: none; }
body.view-single .container { flex-direction: column; }
body.view-single .pane { width: 100%; height: 100%; border-color: transparent; }
body.view-single #content-base { display: block; }
body.view-single #content-t { display: none; }
body.view-single.show-t #content-base { display: none !important; }
body.view-single.show-t #content-t { display: block !important; }
body.view-single .toggle-language-btn { display: inline-block; }
footer { position: fixed; bottom: 10px; right: 10px; z-index: 10; }
footer a {
    color: var(--link-color-inspired); text-decoration: none; font-size: 0.9em;
    padding: 5px 10px; background-color: var(--control-bg);
    border: 1px solid var(--border-color-inspired); border-radius: 5px;
    display: inline-block; transition: background-color 0.2s ease, color 0.2s ease;
}
footer a:hover {
    color: var(--link-hover-color-inspired);
    background-color: #e0e0e0e0; text-decoration: none;
}
@media (max-width: 768px) {
    :root { --control-area-padding: 75px; }
    .container { flex-direction: column !important; }
    .pane { width: 100% !important; height: 100% !important; border: none !important;}
    #content-base { display: block !important; }
    #content-t { display: none !important; }
    body.show-t #content-base { display: none !important; }
    body.show-t #content-t { display: block !important; }
    .toggle-language-btn { display: inline-block !important; }
    .controls { flex-direction: column; align-items: flex-start; gap: 5px; }
    .controls button { width: auto; }
}
"""

# --- Helper Functions (Markdown/File Reading - unchanged) ---

def convert_markdown_headers_to_html(markdown_text):
    """Converts '#', '##', '###' lines to h1/h2/h3 and other lines to <p>."""
    lines = markdown_text.splitlines()
    html_lines = []
    if not markdown_text:
        return "<p><em>Content not available.</em></p>"

    def escape_html(text):
        return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    for line in lines:
        line = line.strip()
        if line.startswith('### '):
            header_text = escape_html(line[4:].strip())
            html_lines.append(f"<h3>{header_text}</h3>")
        elif line.startswith('## '):
            header_text = escape_html(line[3:].strip())
            html_lines.append(f"<h2>{header_text}</h2>")
        elif line.startswith('# '):
            header_text = escape_html(line[2:].strip())
            html_lines.append(f"<h1>{header_text}</h1>")
        elif line:
            escaped_line = escape_html(line)
            html_lines.append(f"<p>{escaped_line}</p>")

    return "\n".join(html_lines) if html_lines else "<p><em>Content seems empty.</em></p>"


def read_file_content(file_path):
    """Reads text content from a file path, returns empty string on error or if missing."""
    content = ""
    try:
        if file_path and file_path.exists():
            content = file_path.read_text(encoding='utf-8')
        else:
             pass # Return empty string if path is None or doesn't exist
    except IOError as e:
        print(f"      Error reading {file_path}: {e}", file=sys.stderr)
    except Exception as e: # Catch other potential errors like decoding errors
        print(f"      Unexpected error reading {file_path}: {e}", file=sys.stderr)
    return content

# --- HTML Generation ---

def create_interactive_html(output_path, base_filename, display_title, content_base_html, content_t_html, prev_file_stem, next_file_stem):
    """Creates a single interactive HTML file with enhanced features and external CSS."""

    nav_data = json.dumps({
        "prev": prev_file_stem + ".html" if prev_file_stem else None,
        "next": next_file_stem + ".html" if next_file_stem else None
    })

    # **MODIFICATION**: Add H1 with display_title ONLY to the beginning of English content
    if content_t_html and not content_t_html.strip().startswith(("<p><em>Content not available.</em>", "<p><em>Content seems empty.</em>")):
        content_t_html = f"<h1>{display_title}</h1>\n{content_t_html}"
    elif not content_t_html: # Handle case where _t file might be missing but we still want a placeholder
         content_t_html = f"<h1>{display_title}</h1>\n<p><em>Content not available.</em></p>"


    # HTML template - Note: article-title div is still present in both panes for structure
    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Comparison: {base_filename}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../articles-styles.css"> </head>
<body>

<div class="controls">
    <button id="cycle-view-btn">View Mode</button>
    <button id="toggle-language-btn" class="toggle-language-btn">Show English (_t)</button>
</div>

<div class="container">
    <div id="content-base" class="pane">
        <div class="article-title">{display_title}</div>
        {content_base_html}
    </div>
    <div id="content-t" class="pane">
        {/* Removed the redundant article-title div here, H1 is added above */}
        {content_t_html}
    </div>
</div>

<footer>
    <a href="../index.html">Home</a>
</footer>

<script id="nav-data" type="application/json">{nav_data}</script>

<script>
    const body = document.body;
    const cycleViewBtn = document.getElementById('cycle-view-btn');
    const toggleLangBtn = document.getElementById('toggle-language-btn');
    const navData = JSON.parse(document.getElementById('nav-data').textContent);
    const viewModes = ['view-hsplit', 'view-vsplit', 'view-single'];
    const viewNames = {{ // Map class name to display name
        'view-hsplit': 'Horizontal Split',
        'view-vsplit': 'Vertical Split',
        'view-single': 'Single Toggle'
    }};
    let currentViewIndex = 0; // Default determined below

    function setView(viewIndex, updateURL = false) {{
        currentViewIndex = viewIndex % viewModes.length;
        const newViewClass = viewModes[currentViewIndex];
        // Reset classes before applying the new one
        body.className = ''; // Clear all previous view/state classes
        body.classList.add(newViewClass); // Add the new view class

        // *** Ensure button text is updated ***
        if (cycleViewBtn) {{ // Add check just in case
             cycleViewBtn.textContent = `View: ${{viewNames[newViewClass]}}`;
        }}

        // Adjust toggle button text and visibility based on the new view
        if (newViewClass === 'view-single') {{
            if (toggleLangBtn) {{
                toggleLangBtn.style.display = ''; // Make visible
                toggleLangBtn.textContent = body.classList.contains('show-t') ? 'Show Chinese' : 'Show English (_t)';
            }}
        }} else {{
             if (toggleLangBtn) {{
                toggleLangBtn.style.display = 'none'; // Hide toggle button
             }}
             body.classList.remove('show-t'); // Ensure English isn't shown if toggled previously
        }}

        if (updateURL && window.history && window.history.replaceState) {{
             const currentUrl = new URL(window.location.href);
             currentUrl.searchParams.set('view', newViewClass);
             window.history.replaceState({{ view: newViewClass }}, '', currentUrl.toString());
        }}
    }}

    function cycleView() {{
        setView(currentViewIndex + 1, true);
    }}

    function toggleLanguage() {{
        if (body.classList.contains('view-single')) {{
            body.classList.toggle('show-t');
            if (toggleLangBtn) {{
                 toggleLangBtn.textContent = body.classList.contains('show-t') ? 'Show Chinese' : 'Show English (_t)';
            }}
        }}
    }}

    function handleKeyDown(event) {{
        // Allow keyboard shortcuts if focus is not on an input/button
        if (document.activeElement && ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {{
             return;
        }}

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {{
            const targetFile = (event.key === 'ArrowLeft') ? navData.prev : navData.next;
            if (targetFile) {{
                const currentViewClass = viewModes[currentViewIndex];
                // Preserve current view mode when navigating
                window.location.href = `${{targetFile}}?view=${{currentViewClass}}`;
            }} else {{
                // Visual feedback for reaching the end
                console.log(`Already at the ${{event.key === 'ArrowLeft' ? 'first' : 'last'}} file.`);
                body.style.transition = 'background-color 0.1s ease-in-out';
                body.style.backgroundColor = '#ffeeee'; // Temporary flash
                setTimeout(() => {{ body.style.backgroundColor = ''; body.style.transition = ''; }}, 200);
            }}
        }} else if (event.key === 'v' || event.key === 'V') {{ // Cycle view with 'v'
             cycleView();
        }} else if (event.key === 't' || event.key === 'T') {{ // Toggle language with 't'
             if (body.classList.contains('view-single')) {{
                 toggleLanguage();
             }}
        }}
    }}

    function initializeView() {{
         const urlParams = new URLSearchParams(window.location.search);
         const viewParam = urlParams.get('view');
         let initialViewIndex = -1;

         if (viewParam && viewModes.includes(viewParam)) {{
             initialViewIndex = viewModes.indexOf(viewParam);
         }} else {{
             // Default to single view on small screens, horizontal split otherwise
             initialViewIndex = (window.innerWidth <= 768)
                ? viewModes.indexOf('view-single')
                : viewModes.indexOf('view-hsplit');
         }}
         // *** Removed setTimeout wrapper - call setView directly ***
         setView(initialViewIndex);
    }}

    // Event Listeners
    cycleViewBtn.addEventListener('click', cycleView);
    if (toggleLangBtn) {{ // Check if button exists before adding listener
        toggleLangBtn.addEventListener('click', toggleLanguage);
    }}
    document.addEventListener('keydown', handleKeyDown);
    // Use DOMContentLoaded to ensure elements are ready before initializing view
    document.addEventListener('DOMContentLoaded', initializeView);

</script>

</body>
</html>"""

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(html_template, encoding='utf-8')
        return True
    except IOError as e:
        print(f"    Error creating interactive HTML {output_path}: {e}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"    Unexpected error creating interactive HTML {output_path}: {e}", file=sys.stderr)
        return False

# --- File Writing Function ---

def write_css_file(css_path, content):
    """Writes the CSS content to a file if it doesn't exist or is different."""
    should_write = True
    if css_path.exists():
        try:
            existing_content = css_path.read_text(encoding='utf-8').strip()
            # Normalize line endings for comparison
            if existing_content == content.strip():
                should_write = False
                print(f"CSS file '{css_path}' is up-to-date.")
            else:
                 print(f"CSS file '{css_path}' content differs. Overwriting.")
        except Exception as e:
            print(f"Error reading existing CSS file {css_path}: {e}. Overwriting.")

    if should_write:
        try:
            # Create directories if they don't exist
            css_path.parent.mkdir(parents=True, exist_ok=True)
            css_path.write_text(content, encoding='utf-8')
            print(f"CSS file '{css_path}' written successfully.")
        except Exception as e:
            print(f"Error writing CSS file '{css_path}': {e}", file=sys.stderr)

# --- Main Processing Logic ---

def process_directory_pair(base_dir_path, t_dir_path, final_dir_path):
    """Processes a pair of directories with natural sorting and view state preservation."""
    print(f"\nProcessing pair: {base_dir_path.name} <=> {t_dir_path.name if t_dir_path.exists() else t_dir_path.name + ' (missing)'}")
    print(f"  Output directory: {final_dir_path}")

    if not base_dir_path.is_dir():
        print(f"  Error: Base directory not found: {base_dir_path}", file=sys.stderr)
        return

    final_dir_path.mkdir(parents=True, exist_ok=True)
    t_dir_exists = t_dir_path.is_dir()

    try:
        base_md_files_unsorted = [
            f for f in base_dir_path.iterdir()
            if f.is_file() and f.suffix.lower() == '.md'
        ]
        base_md_files = sorted(base_md_files_unsorted, key=lambda x: natural_sort_key(x.name))
        base_md_stems = [f.stem for f in base_md_files]
        print(f"  Found and naturally sorted {len(base_md_stems)} markdown files in {base_dir_path.name}.")
    except Exception as e:
        print(f"  Error listing/sorting files in {base_dir_path}: {e}", file=sys.stderr)
        return

    if not base_md_files:
        print("  No markdown files found in base directory to process.")
        return

    # Regex to capture year and issue number from stem (improved robustness)
    title_regex = re.compile(r"(\d{4})\s*[-_]?\s*(\d+)(?:[-_].*)?") # More flexible separators

    for i, base_file_path in enumerate(base_md_files):
        base_filename_stem = base_file_path.stem
        print(f"  Processing file ({i+1}/{len(base_md_stems)}): {base_file_path.name} -> {base_filename_stem}.html")

        # --- Extract and Format Title ---
        display_title = base_filename_stem # Default title if format fails
        match = title_regex.match(base_filename_stem)
        if match:
            year, issue_num = match.groups()
            # Format consistently as YYYY - n##
            display_title = f"{year} - n{int(issue_num):02d}" # Pad issue number if needed
        else:
            print(f"      Warning: Could not parse year/issue from filename '{base_filename_stem}' using regex. Using stem as title.")
        # --- End Title Extraction ---

        prev_file_stem = base_md_stems[i-1] if i > 0 else None
        next_file_stem = base_md_stems[i+1] if i < len(base_md_stems) - 1 else None

        t_file_path = t_dir_path / base_file_path.name if t_dir_exists else None
        output_html_path = final_dir_path / f"{base_filename_stem}.html"

        content_base_md = read_file_content(base_file_path)
        content_t_md = read_file_content(t_file_path)

        content_base_html = convert_markdown_headers_to_html(content_base_md)
        content_t_html = convert_markdown_headers_to_html(content_t_md)

        create_interactive_html(
            output_html_path,
            base_filename_stem,
            display_title, # Pass the formatted title
            content_base_html,
            content_t_html,
            prev_file_stem,
            next_file_stem
        )

# --- Main Function ---

def main():
    """Main function to find directory pairs and process them."""
    current_dir = Path('.')
    # Place CSS file in the root, assuming HTML files are in subdirs like '1945_final'
    css_file_path = current_dir / "articles-styles.css"

    print(f"Checking/Writing CSS file: {css_file_path}")
    write_css_file(css_file_path, CSS_CONTENT)
    print("-" * 20)

    print("Scanning for directory pairs (e.g., '1945' and '1945_t')...")
    all_dirs = [d for d in current_dir.iterdir() if d.is_dir() and not d.name.endswith('_final')]
    base_dirs = {d.name: d for d in all_dirs if not d.name.endswith('_t')}
    t_dirs = {d.name[:-2]: d for d in all_dirs if d.name.endswith('_t')}

    processed_count = 0

    if not base_dirs:
        print("No base directories (like '1945') found to process.")
        return

    sorted_base_names = sorted(base_dirs.keys(), key=natural_sort_key)

    for base_name in sorted_base_names:
        base_dir = base_dirs[base_name]
        t_dir = t_dirs.get(base_name) # Use .get() to handle missing _t dirs gracefully
        final_dir = current_dir / f"{base_name}_final"

        # Decide the path for the corresponding _t directory, even if it doesn't exist
        t_dir_path_for_processing = t_dir if t_dir else current_dir / f"{base_name}_t"

        if t_dir:
             process_directory_pair(base_dir, t_dir_path_for_processing, final_dir)
             processed_count += 1
        else:
            # Process even if _t is missing, read_file_content handles it
            print(f"\nNote: Found base directory '{base_dir.name}' but no matching '_t' directory '{t_dir_path_for_processing.name}'. Processing base files only.")
            process_directory_pair(base_dir, t_dir_path_for_processing, final_dir)
            # You might not want to increment processed_count here if you only count pairs
            # processed_count += 1 # Uncomment if you want to count base dirs processed alone

    print("-" * 20)
    # Refined message based on whether any base dirs were found and processed
    if not base_dirs:
         print("No base directories found to process.")
    elif processed_count == 0 and not any(p in t_dirs for p in base_dirs):
         print("\nProcessed base directories, but no matching '_t' pairs were found.")
    elif processed_count > 0:
         print(f"\nFinished processing {processed_count} directory pair(s).")
    else: # Case where base dirs exist, but no _t dirs exist at all
         print("\nFinished processing base directories (no corresponding '_t' directories found).")


if __name__ == "__main__":
    main()

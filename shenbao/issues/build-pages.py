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

# Updated CSS content (same as before)
CSS_CONTENT = """
:root {
    /* Color Palette Inspired by index-styles.css */
    --primary-color: #1e472e;
    --secondary-color: #363e35;
    --accent-color: #3c5244; /* Base green for controls */
    --border-color-inspired: #a3b8a4;
    --link-color-inspired: #2a4b30;
    --link-hover-color-inspired: #436542; /* Darker green for active/hover */
    --button-text-color: white;
    --inactive-button-bg: #a3cca3; /* Lighter gentle green for inactive view buttons */


    /* Original Variables */
    --chinese-font: 'Noto Serif TC', serif;
    --english-font: Georgia, serif;
    --border-color: #ccc;
    --control-bg: #f0f0f0e0;
    --pane-padding: 15px;
    --control-area-padding: 60px; /* Adjusted padding for controls area */
}
html { height: 100%; }
body {
    font-family: sans-serif; margin: 0;
    box-sizing: border-box;
    height: 100%;
}
.controls {
    position: fixed; top: 10px; left: 10px;
    display: flex; gap: 8px;
    align-items: center;
    z-index: 10;
    background: var(--control-bg); /* Add slight background for visibility */
    padding: 5px;
    border-radius: 3px;
}
/* Style for the button group container */
.view-mode-buttons {
    display: inline-flex; /* Group buttons together */
    border: 1px solid var(--accent-color); /* Shared border */
}

/* General button style (applies to language toggle too) */
.controls button {
    padding: 5px 10px; cursor: pointer;
    background-color: var(--accent-color); /* Default for non-view buttons */
    color: var(--button-text-color);
    border: none;
    border-radius: 0; /* All buttons square now */
    transition: background-color 0.2s ease;
    font-size: 1em;
    line-height: 1.2;
    text-align: center;
}
.controls button:hover {
    background-color: var(--link-hover-color-inspired); /* Darker green on hover */
}

/* Specific styles for view mode buttons within the group */
.controls .view-mode-buttons button {
    background-color: var(--inactive-button-bg); /* Lighter green for inactive */
    min-width: 30px; /* Give symbols some space */
}
/* Add separator lines within the group */
.controls .view-mode-buttons button:not(:last-child) {
    border-right: 1px solid var(--button-text-color); /* White separator */
}
/* Override for the ACTIVE view button */
.controls .view-mode-buttons button.active-view {
    background-color: var(--link-hover-color-inspired); /* Darker green for active */
    font-weight: bold;
}
/* Hover effect specifically for view mode buttons (can be same as active or slightly different) */
.controls .view-mode-buttons button:hover {
    background-color: var(--link-hover-color-inspired); /* Darker green on hover */
}


.container {
    display: flex; 
    height: 100%;
    width: 100%;
    overflow: hidden; box-sizing: border-box;
}
.pane {
    border: 1px solid transparent;
    padding: var(--pane-padding);
    overflow-y: auto; box-sizing: border-box;
}
.pane .article-title {
    display: none; /* Title within pane is usually hidden, shown in H1 above */
}
#content-t h1 { /* Style for the title added in Python */
    font-family: var(--english-font); font-size: 1.5em; font-weight: bold;
    color: #333; margin-top: 0; margin-bottom: 0.8em;
    padding-top: 0; /* Removed padding-top as body padding exists */
    padding-bottom: 0; border-bottom: none;
}
.pane h2, .pane h3 { margin-top: 0.5em; margin-bottom: 0.5em; }
#content-base { font-family: var(--chinese-font); }
#content-t { font-family: var(--english-font); }
#content-base h3 { font-size: 1.3em; }

/* Horizontal Split (| button, side-by-side panes, vertical divider) */
body.view-hsplit .container { flex-direction: row; }
body.view-hsplit .pane { width: 50%; height: 100%; border-color: transparent; }
body.view-hsplit #content-base { border-right: 1px solid var(--border-color); display: block !important; }
body.view-hsplit #content-t { display: block !important; }
body.view-hsplit .toggle-language-btn { display: none; }

/* Vertical Split (– button, top/bottom panes, horizontal divider) */
body.view-vsplit .container { flex-direction: column; }
body.view-vsplit .pane { width: 100%; height: 50%; border-color: transparent; }
body.view-vsplit #content-base { border-bottom: 1px solid var(--border-color); display: block !important; }
body.view-vsplit #content-t { display: block !important; }
body.view-vsplit .toggle-language-btn { display: none; }

/* Single View (☐ button) */
body.view-single .container { flex-direction: column; }
body.view-single .pane { width: 100%; height: 100%; border-color: transparent; }
body.view-single #content-base { display: block; }
body.view-single #content-t { display: none; }
body.view-single.show-t #content-base { display: none !important; }
body.view-single.show-t #content-t { display: block !important; }
body.view-single .toggle-language-btn { display: inline-block; }

footer {
    position: fixed; bottom: 10px; right: 10px; z-index: 10;
}
footer a {
    color: var(--link-color-inspired); text-decoration: none;
    font-size: 0.9em;
    padding: 5px 10px; background-color: var(--control-bg);
    border: 1px solid var(--border-color-inspired);
    border-radius: 0; /* Square footer link too, for consistency */
    display: inline-block;
    transition: background-color 0.2s ease, color 0.2s ease;
    margin-right: 20px; /* Retained margin */
}
footer a:hover {
    color: var(--link-hover-color-inspired);
    background-color: #e0e0e0e0; text-decoration: none;
}

/* Small screen adjustments */
@media (max-width: 768px) {
    /* :root { --control-area-padding: 75px; } /* Example: Increase padding if needed */
    /* Force single view layout regardless of body class */
    .container { flex-direction: column !important; height: calc(100% - var(--control-area-padding)) !important; }
    .pane { width: 100% !important; height: 100% !important; border: none !important;}
    #content-base { display: block !important; }
    #content-t { display: none !important; }
    body.show-t #content-base { display: none !important; }
    body.show-t #content-t { display: block !important; }
    .toggle-language-btn { display: inline-block !important; } /* Always show lang toggle */
    .controls { flex-direction: row; flex-wrap: wrap; /* Allow wrapping */ align-items: center; gap: 5px; } /* Change to row for better mobile layout */
    .controls button { width: auto; /* Allow buttons to size naturally */ }
    .view-mode-buttons { flex-wrap: nowrap; /* Keep view buttons together */ }

    /* Hide split buttons, only show single view button */
    #view-vsplit-btn { display: none; } /* Hide '|' */
    #view-hsplit-btn { display: none; } /* Hide '–' */
    #view-single-btn { display: inline-block; } /* Ensure '☐' is shown */

    /* Adjust border for single button when others are hidden */
    .controls .view-mode-buttons button:not(:last-child) { border-right: none; } /* Remove internal borders */
    #view-single-btn { border-right: none; } /* No border needed */
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
    """Creates a single interactive HTML file with separate view buttons."""

    nav_data = json.dumps({
        "prev": prev_file_stem + ".html" if prev_file_stem else None,
        "next": next_file_stem + ".html" if next_file_stem else None
    })

    # Add H1 title to the English content pane only if content exists
    if content_t_html and not content_t_html.strip().startswith(("<p><em>Content not available.</em>", "<p><em>Content seems empty.</em>")):
        # Escape the title for HTML safety before embedding
        safe_display_title = display_title.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        content_t_html = f"<h1>{safe_display_title}</h1>\n{content_t_html}"
    elif not content_t_html: # If English content is missing entirely
         safe_display_title = display_title.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
         content_t_html = f"<h1>{safe_display_title}</h1>\n<p><em>Content not available.</em></p>"


    # *** CORRECTED HTML template with escaped curly braces in <script> ***
    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{base_filename} Shenbao</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet">
<style>{CSS_CONTENT}</style> 
</head>
<body>

<div class="controls">
    <div class="view-mode-buttons">
        <button id="view-vsplit-btn" data-view="view-hsplit">|</button>
        <button id="view-hsplit-btn" data-view="view-vsplit">–</button>
        <button id="view-single-btn" data-view="view-single">☐</button>
    </div>
    <button id="toggle-language-btn" class="toggle-language-btn">English</button>
</div>

<div class="container">
    <div id="content-base" class="pane">
        {content_base_html}
    </div>
    <div id="content-t" class="pane">
        {content_t_html}
    </div>
</div>

<footer>
    <a href="../index.html">Home</a>
</footer>

<script id="nav-data" type="application/json">{nav_data}</script>

<script>
    const body = document.body;
    const toggleLangBtn = document.getElementById('toggle-language-btn');
    const viewVsplitBtn = document.getElementById('view-vsplit-btn'); // Button labeled '|' -> hsplit class
    const viewHsplitBtn = document.getElementById('view-hsplit-btn'); // Button labeled '–' -> vsplit class
    const viewSingleBtn = document.getElementById('view-single-btn'); // Button labeled '☐' -> single class
    const viewButtons = [viewVsplitBtn, viewHsplitBtn, viewSingleBtn].filter(btn => btn); // Filter out nulls if hidden
    const navData = JSON.parse(document.getElementById('nav-data').textContent);
    const validViewClasses = ['view-vsplit', 'view-hsplit', 'view-single'];
    const smallScreenWidth = 768; // Define max width for "small screen"

    function setView(newViewClass, updateURL = false) {{ // Escaped {{ and }}
        if (!validViewClasses.includes(newViewClass)) {{ // Escaped {{ and }}
            console.warn('Invalid view class requested:', newViewClass);
            return; // Don't proceed if the class is not valid
        }} // Escaped }}

        const isSmallScreen = window.innerWidth <= smallScreenWidth;

        // Force single view on small screens
        if (isSmallScreen && newViewClass !== 'view-single') {{ // Escaped {{ and }}
            console.log(`Screen is small or resized to small. Forcing single view instead of requested '${{newViewClass}}'.`); // Python format brace remains single
            newViewClass = 'view-single';
        }} // Escaped }}

        // Reset classes before applying the new one
        body.className = ''; // Clear all previous view/state classes
        body.classList.add(newViewClass); // Add the final determined view class

        // Update button active states based on the FINAL applied view class
        viewButtons.forEach(btn => {{ // Escaped {{ and }}
             if (btn) {{ // Escaped {{ and }} // Check if button exists
                 // Check if the button's intended view matches the applied class
                 if (btn.dataset.view === newViewClass) {{ // Escaped {{ and }}
                    btn.classList.add('active-view');
                 }} else {{ // Escaped {{ and }}
                    btn.classList.remove('active-view');
                 }} // Escaped }}
                 btn.style.backgroundColor = ''; // Let CSS handle the background colors via active-view class
            }} // Escaped }}
        }}); // Escaped }}

        // Adjust toggle button text and visibility based on the new view
        if (newViewClass === 'view-single') {{ // Escaped {{ and }}
            // In single view (or forced single view on small screens), show toggle button
            if (toggleLangBtn) toggleLangBtn.style.display = ''; // Make visible
            body.classList.remove('show-t'); // Default to showing base language first
            if (toggleLangBtn) toggleLangBtn.textContent = 'English';
        }} else {{ // Escaped {{ and }}
            // In split views (only possible on larger screens), hide toggle button
            if (toggleLangBtn) toggleLangBtn.style.display = 'none'; // Hide toggle button
            body.classList.remove('show-t'); // Ensure English isn't shown if toggled previously
        }} // Escaped }}

        // Update URL only if requested AND view changed
        if (updateURL && window.history && window.history.replaceState) {{ // Escaped {{ and }}
             const currentUrl = new URL(window.location.href);
             if (currentUrl.searchParams.get('view') !== newViewClass) {{ // Escaped {{ and }}
                 currentUrl.searchParams.set('view', newViewClass);
                 window.history.replaceState({{ view: newViewClass }}, '', currentUrl.toString()); // Escaped {{ and }} for inner object literal
             }} // Escaped }}
        }} // Escaped }}
    }} // Escaped function }}


    function toggleLanguage() {{ // Escaped {{ and }}
        // Language toggle only makes sense in single view mode
        if (body.classList.contains('view-single')) {{ // Escaped {{ and }}
            body.classList.toggle('show-t');
            if (toggleLangBtn) {{ // Escaped {{ and }}
                toggleLangBtn.textContent = body.classList.contains('show-t') ? 'Chinese' : 'English';
            }} // Escaped }}
        }} // Escaped }}
    }} // Escaped function }}

    function handleKeyDown(event) {{ // Escaped {{ and }}
        // Allow keyboard shortcuts if focus is not on an input/button
        if (document.activeElement && ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {{ // Escaped {{ and }}
             return;
        }} // Escaped }}

        const isSmallScreen = window.innerWidth <= smallScreenWidth;

        // Navigation
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {{ // Escaped {{ and }}
            const targetFile = (event.key === 'ArrowLeft') ? navData.prev : navData.next;
            if (targetFile) {{ // Escaped {{ and }}
                let currentViewClass = 'view-single'; // Default to single view for next page on small screens
                if (!isSmallScreen) {{ // Escaped {{ and }} // Only check current view if not on small screen
                    validViewClasses.forEach(vc => {{ // Escaped {{ and }}
                        if (body.classList.contains(vc)) {{ currentViewClass = vc; }} // Escaped {{ and }}
                    }}); // Escaped }}
                }} // Escaped }}
                 // Python format braces remain single here
                 window.location.href = `${{targetFile}}?view=${{currentViewClass}}`;
            }} else {{ // Escaped {{ and }}
                console.log(`Already at the ${{event.key === 'ArrowLeft' ? 'first' : 'last'}} file.`); // Python format brace remains single
                body.style.transition = 'background-color 0.1s ease-in-out';
                body.style.backgroundColor = '#ffeeee'; // Temporary flash
                setTimeout(() => {{ body.style.backgroundColor = ''; body.style.transition = ''; }}, 200); // Escaped {{ and }}
            }} // Escaped }}
        }} // Escaped }}
        // View Switching Keys (respect small screen override)
        else if (event.key === 'v' || event.key === 'V') {{ // Escaped {{ and }} // '|' button view
             setView('view-hsplit', true); // Attempt horizontal split (will become single on small)
        }} else if (event.key === 'h' || event.key === 'H') {{ // Escaped {{ and }} // '–' button view
             setView('view-vsplit', true); // Attempt vertical split (will become single on small)
        }} else if (event.key === 's' || event.key === 'S') {{ // Escaped {{ and }} // '☐' button view
             setView('view-single', true); // Set single view
        }} // Escaped }}
        // Language Toggle
        else if (event.key === 't' || event.key === 'T') {{ // Escaped {{ and }}
             // Only toggle if currently in single view mode (which includes small screens)
             if (body.classList.contains('view-single')) {{ // Escaped {{ and }}
                 toggleLanguage();
             }} // Escaped }}
        }} // Escaped }}
    }} // Escaped function }}

    function initializeView() {{ // Escaped {{ and }}
         const urlParams = new URLSearchParams(window.location.search);
         const viewParam = urlParams.get('view');
         let initialViewClass = null;
         const isSmallScreen = window.innerWidth <= smallScreenWidth;

         if (viewParam && validViewClasses.includes(viewParam)) {{ // Escaped {{ and }}
             initialViewClass = viewParam;
             // Override URL param if screen is small
             if (isSmallScreen && initialViewClass !== 'view-single') {{ // Escaped {{ and }}
                 console.log(`URL requested view '${{initialViewClass}}', but screen is small. Overriding to single view.`); // Python format brace remains single
                 initialViewClass = 'view-single';
             }} // Escaped }}
         }} else {{ // Escaped {{ and }}
             // Default to single view on small screens
             initialViewClass = isSmallScreen ? 'view-single' : 'view-hsplit'; // Default horizontal split on large, single on small
         }} // Escaped }}

         // Final check (redundant with above override, but safe)
         if (isSmallScreen && initialViewClass !== 'view-single') {{ // Escaped {{ and }}
             initialViewClass = 'view-single';
         }} // Escaped }}

         // Use setTimeout to ensure styles are applied after initial render
         setTimeout(() => setView(initialViewClass), 0); // Escaped {{ and }} // Set view without updating URL on initial load
    }} // Escaped function }}

    // --- Event Listeners ---
    if (viewVsplitBtn) {{ viewVsplitBtn.addEventListener('click', () => setView(viewVsplitBtn.dataset.view, true)); }} // Escaped {{ and }}
    if (viewHsplitBtn) {{ viewHsplitBtn.addEventListener('click', () => setView(viewHsplitBtn.dataset.view, true)); }} // Escaped {{ and }}
    if (viewSingleBtn) {{ viewSingleBtn.addEventListener('click', () => setView(viewSingleBtn.dataset.view, true)); }} // Escaped {{ and }}
    if (toggleLangBtn) {{ toggleLangBtn.addEventListener('click', toggleLanguage); }} // Escaped {{ and }}

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('DOMContentLoaded', initializeView);

    // --- Resize Listener ---
    window.addEventListener('resize', () => {{ // Escaped {{ and }}
        const isSmallScreen = window.innerWidth <= smallScreenWidth;
        const currentlySingle = body.classList.contains('view-single');

        // If screen becomes small AND we are NOT already in single view, switch to single view
        if (isSmallScreen && !currentlySingle) {{ // Escaped {{ and }}
            console.log("Screen resized to small. Forcing single view.");
            setView('view-single', true); // Force single view and update URL if needed
        }} // Escaped }}
        // Optional logic for resizing large can be added here in an else if block if needed
    }}); // Escaped }}
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


# --- File Writing Function (unchanged) ---
# (No changes needed here)
def write_css_file(css_path, content):
    """Writes the CSS content to a file if it doesn't exist or is different."""
    should_write = True
    if css_path.exists():
        try:
            existing_content = css_path.read_text(encoding='utf-8').strip()
            if existing_content == content.strip():
                should_write = False
                print(f"CSS file '{css_path}' is up-to-date.")
            else:
                 print(f"CSS file '{css_path}' content differs. Overwriting.")
        except Exception as e:
            print(f"Error reading existing CSS file {css_path}: {e}. Overwriting.")

    if should_write:
        try:
            css_path.parent.mkdir(parents=True, exist_ok=True)
            css_path.write_text(content, encoding='utf-8')
            print(f"CSS file '{css_path}' written successfully.")
        except Exception as e:
            print(f"Error writing CSS file '{css_path}': {e}", file=sys.stderr)


# --- Main Processing Logic (unchanged) ---
# (No changes needed here)
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

    date_regex = re.compile(r"^(\d{4})[._-]?(\d{2})[._-]?(\d{2})$")

    for i, base_file_path in enumerate(base_md_files):
        base_filename_stem = base_file_path.stem
        print(f"  Processing file ({i+1}/{len(base_md_stems)}): {base_file_path.name} -> {base_filename_stem}.html")

        display_title = base_filename_stem
        match = date_regex.match(base_filename_stem)
        if match:
            year, month, day = match.groups()
            display_title = f"{year}.{month}.{day}"
        else:
            print(f"      Warning: Could not parse year/issue from filename '{base_filename_stem}' using regex. Using stem as title.")

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
            display_title,
            content_base_html,
            content_t_html,
            prev_file_stem,
            next_file_stem
        )

# --- Main Function ---
# (No changes needed here)
def main():
    """Main function to find directory pairs and process them."""
    current_dir = Path('.')
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
        t_dir = t_dirs.get(base_name)
        final_dir = current_dir / f"{base_name}_final"
        t_dir_path_for_processing = t_dir if t_dir else current_dir / f"{base_name}_t"

        if t_dir:
             process_directory_pair(base_dir, t_dir_path_for_processing, final_dir)
             processed_count += 1
        else:
            print(f"\nNote: Found base directory '{base_dir.name}' but no matching '_t' directory '{t_dir_path_for_processing.name}'. Processing base files only.")
            process_directory_pair(base_dir, t_dir_path_for_processing, final_dir)

    print("-" * 20)
    if not base_dirs:
         print("No base directories found to process.")
    elif processed_count == 0 and not any(p in t_dirs for p in base_dirs):
         print("\nProcessed base directories, but no matching '_t' pairs were found.")
    elif processed_count > 0:
         print(f"\nFinished processing {processed_count} directory pair(s).")
    else:
         print("\nFinished processing base directories (no corresponding '_t' directories found).")


if __name__ == "__main__":
    main()
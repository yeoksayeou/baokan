#!/usr/bin/env python3

import os
import re
import sys
from pathlib import Path
import json

def natural_sort_key(s, _nsre=re.compile('([0-9]+)')):
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split(_nsre, str(s))]

CSS_CONTENT = """
:root {
    --primary-color: #1e472e;
    --secondary-color: #363e35;
    --accent-color: #3c5244;
    --border-color-inspired: #a3b8a4;
    --link-color-inspired: #2a4b30;
    --link-hover-color-inspired: #436542;
    --button-text-color: white;
    --inactive-button-bg: #a3cca3;
    --chinese-font: 'Noto Serif TC', serif;
    --english-font: Georgia, serif;
    --border-color: #ccc;
    --control-bg: #f0f0f0e0; /* Background for floating elements */
    --pane-base-padding: 15px; /* Base padding for content */
    --pane-top-padding: 50px;  /* Extra top padding to avoid overlap */
}
html { height: 100%; }
body {
    font-family: sans-serif; margin: 0;
    box-sizing: border-box;
    height: 100%;
    /* Removed body padding */
}
.controls {
    position: fixed; top: 10px; left: 10px;
    display: flex; gap: 8px;
    align-items: center;
    z-index: 10;
    background-color: var(--control-bg); /* Keep background for floating */
    padding: 5px;
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Lighter shadow */
}
.view-mode-buttons {
    display: inline-flex;
    border: 1px solid var(--accent-color);
}
.controls button {
    padding: 5px 10px; cursor: pointer;
    background-color: var(--accent-color);
    color: var(--button-text-color);
    border: none;
    border-radius: 0;
    transition: background-color 0.2s ease;
    font-size: 1em;
    line-height: 1.2;
    text-align: center;
}
.controls button:hover {
    background-color: var(--link-hover-color-inspired);
}
.controls .view-mode-buttons button {
    background-color: var(--inactive-button-bg);
    min-width: 30px;
}
.controls .view-mode-buttons button:not(:last-child) {
    border-right: 1px solid var(--button-text-color);
}
.controls .view-mode-buttons button.active-view {
    background-color: var(--link-hover-color-inspired);
    font-weight: bold;
}
.controls .view-mode-buttons button:hover {
    background-color: var(--link-hover-color-inspired);
}
.container {
    display: flex; height: 100%; width: 100%; /* Occupy full viewport */
    overflow: hidden; box-sizing: border-box;
    /* Removed margin-top */
}
.pane {
    border: 1px solid transparent;
    /* Apply base padding + specific top padding */
    padding: var(--pane-top-padding) var(--pane-base-padding) var(--pane-base-padding);
    overflow-y: auto; box-sizing: border-box;
    height: 100%; /* Ensure panes fill container height */
}
.pane .article-title {
    display: none;
}
#content-t h1 {
    font-family: var(--english-font); font-size: 1.5em; font-weight: bold;
    color: #333; margin-top: 0; margin-bottom: 0.8em;
    padding-top: 0; /* No extra padding needed here */
    padding-bottom: 0; border-bottom: none;
}
.pane h2, .pane h3 { margin-top: 0.5em; margin-bottom: 0.5em; }
#content-base { font-family: var(--chinese-font); }
#content-t { font-family: var(--english-font); }
#content-base h3 { font-size: 1.3em; }
body.view-hsplit .container { flex-direction: row; }
body.view-hsplit .pane { width: 50%; }
body.view-hsplit #content-base { border-right: 1px solid var(--border-color); display: block !important; }
body.view-hsplit #content-t { display: block !important; }
body.view-hsplit .toggle-language-btn { display: none; }
body.view-vsplit .container { flex-direction: column; }
body.view-vsplit .pane { width: 100%; height: 50%; } /* Height adjusted for split */
body.view-vsplit #content-base { border-bottom: 1px solid var(--border-color); display: block !important; }
body.view-vsplit #content-t { display: block !important; }
body.view-vsplit .toggle-language-btn { display: none; }
body.view-single .container { flex-direction: column; }
body.view-single .pane { width: 100%; height: 100%; } /* Full height in single */
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
    padding: 5px 10px; background-color: var(--control-bg); /* Keep background */
    border: 1px solid var(--border-color-inspired);
    border-radius: 3px; /* Match controls rounding */
    display: inline-block;
    transition: background-color 0.2s ease, color 0.2s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Match controls shadow */
    margin-right: 15px;
}
footer a:hover {
    color: var(--link-hover-color-inspired);
    background-color: #e0e0e0e0; text-decoration: none;
}
@media (max-width: 768px) {
    /* No body padding override needed */
    .container {
         /* Height already 100% */
    }
    .controls {
        /* Style is already fine, ensure no conflicting overrides */
        background-color: var(--control-bg); /* Keep background */
        padding: 5px;
        border-radius: 3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        flex-direction: row; /* Ensure horizontal */
    }
    .pane {
       /* Ensure top padding is consistent */
       padding-top: var(--pane-top-padding);
    }
    #view-hsplit-btn, #view-vsplit-btn {
        display: none;
    }
    #view-single-btn {
        display: inline-block;
        border-right: none;
    }
    .controls .view-mode-buttons {
        border: 1px solid var(--accent-color);
    }
    .toggle-language-btn {
        display: inline-block !important;
    }
    /* Single view layout rules remain the same */
    .container { flex-direction: column !important; }
    .pane { width: 100% !important; height: 100% !important; border: none !important;}
    #content-base { display: block !important; }
    #content-t { display: none !important; }
    body.show-t #content-base { display: none !important; }
    body.show-t #content-t { display: block !important; }
}
"""

def convert_markdown_headers_to_html(markdown_text):
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
    content = ""
    try:
        if file_path and file_path.exists():
            content = file_path.read_text(encoding='utf-8')
        else:
             pass
    except IOError as e:
        print(f"      Error reading {file_path}: {e}", file=sys.stderr)
    except Exception as e:
        print(f"      Unexpected error reading {file_path}: {e}", file=sys.stderr)
    return content

def create_interactive_html(output_path, base_filename, display_title, content_base_html, content_t_html, prev_file_stem, next_file_stem):

    nav_data = json.dumps({
        "prev": prev_file_stem + ".html" if prev_file_stem else None,
        "next": next_file_stem + ".html" if next_file_stem else None
    })

    if content_t_html and not content_t_html.strip().startswith(("<p><em>Content not available.</em>", "<p><em>Content seems empty.</em>")):
        content_t_html = f"<h1>{display_title}</h1>\n{content_t_html}"
    elif not content_t_html:
         content_t_html = f"<h1>{display_title}</h1>\n<p><em>Content not available.</em></p>"

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
    <div class="view-mode-buttons">
        <button id="view-hsplit-btn" data-view="view-hsplit">|</button>
        <button id="view-vsplit-btn" data-view="view-vsplit">–</button>
        <button id="view-single-btn" data-view="view-single">☐</button>
    </div>
    <button id="toggle-language-btn" class="toggle-language-btn">To English</button>
</div>

<div class="container">
    <div id="content-base" class="pane">
        <div class="article-title">{display_title}</div>
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
    const viewHsplitBtn = document.getElementById('view-hsplit-btn');
    const viewVsplitBtn = document.getElementById('view-vsplit-btn');
    const viewSingleBtn = document.getElementById('view-single-btn');
    const viewButtons = [viewHsplitBtn, viewVsplitBtn, viewSingleBtn];
    const navData = JSON.parse(document.getElementById('nav-data').textContent);
    const validViewClasses = ['view-hsplit', 'view-vsplit', 'view-single'];
    const smallScreenBreakpoint = 768;

    function getCurrentViewClass() {{
        for (const vc of validViewClasses) {{
            if (body.classList.contains(vc)) {{
                return vc;
            }}
        }}
        return null;
    }}

    function updateURLState(currentViewClass) {{
        if (!currentViewClass) return;
        if (window.history && window.history.replaceState) {{
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('view', currentViewClass);

            if (currentViewClass === 'view-single' && body.classList.contains('show-t')) {{
                currentUrl.searchParams.set('lang', 't');
            }} else {{
                currentUrl.searchParams.delete('lang');
            }}
            try {{
                window.history.replaceState({{ view: currentViewClass, lang: body.classList.contains('show-t') ? 't' : null }}, '', currentUrl.toString());
            }} catch (e) {{
                 console.error("Error updating URL state:", e);
            }}
        }}
    }}

    function setView(newViewClass, updateURL = false, fromResize = false) {{
        if (!validViewClasses.includes(newViewClass)) {{
            console.warn('Invalid view class requested:', newViewClass);
            return;
        }}

        const isSmallScreen = window.innerWidth <= smallScreenBreakpoint;
        if (isSmallScreen && newViewClass !== 'view-single') {{
             newViewClass = 'view-single';
        }}

        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        const isSingleView = newViewClass === 'view-single';

        body.className = '';
        body.classList.add(newViewClass);

        viewButtons.forEach(btn => {{
             if (btn) {{
                 btn.classList.toggle('active-view', btn.dataset.view === newViewClass);
                 btn.style.backgroundColor = '';
            }}
        }});

        if (isSingleView) {{
            toggleLangBtn.style.display = '';
            let showT = body.classList.contains('show-t');
            // Only apply langParam if not coming from resize and lang wasn't already set
            if (!fromResize && langParam === 't' && !showT) {{
                 body.classList.add('show-t');
                 showT = true;
             }}
             // Update button text based on the final state
            toggleLangBtn.textContent = showT ? 'Show Chinese' : 'Show English';
        }} else {{
            toggleLangBtn.style.display = 'none';
            body.classList.remove('show-t'); // Ensure show-t is removed if not single view
        }}

        if (updateURL) {{
             updateURLState(newViewClass);
        }}
    }}

    function toggleLanguage() {{
        if (body.classList.contains('view-single')) {{
            body.classList.toggle('show-t');
            toggleLangBtn.textContent = body.classList.contains('show-t') ? 'Show Chinese' : 'Show English';
            updateURLState('view-single');
        }}
    }}

    function handleKeyDown(event) {{
        if (document.activeElement && ['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {{
             return;
        }}

        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {{
            const targetFile = (event.key === 'ArrowLeft') ? navData.prev : navData.next;
            if (targetFile) {{
                 let currentViewClass = getCurrentViewClass() || 'view-hsplit';
                 if (window.innerWidth <= smallScreenBreakpoint) {{
                     currentViewClass = 'view-single';
                 }}
                 let targetUrl = `${{targetFile}}?view=${{currentViewClass}}`;
                 if (currentViewClass === 'view-single' && body.classList.contains('show-t')) {{
                    targetUrl += '&lang=t';
                 }}
                 window.location.href = targetUrl;
            }} else {{
                console.log(`Already at the ${{event.key === 'ArrowLeft' ? 'first' : 'last'}} file.`);
                body.style.transition = 'background-color 0.1s ease-in-out';
                body.style.backgroundColor = '#ffeeee';
                setTimeout(() => {{ body.style.backgroundColor = ''; body.style.transition = ''; }}, 200);
            }}
        }}
        else if (event.key === 'h' || event.key === 'H') {{ if(window.innerWidth > smallScreenBreakpoint) setView('view-hsplit', true); }}
        else if (event.key === 'v' || event.key === 'V') {{ if(window.innerWidth > smallScreenBreakpoint) setView('view-vsplit', true); }}
        else if (event.key === 's' || event.key === 'S') {{ setView('view-single', true); }}
        else if (event.key === 't' || event.key === 'T') {{
             if (body.classList.contains('view-single')) {{
                 toggleLanguage();
             }}
        }}
    }}

    function initializeView() {{
         const urlParams = new URLSearchParams(window.location.search);
         const viewParam = urlParams.get('view');
         const langParam = urlParams.get('lang');
         let initialViewClass = null;
         const isSmallScreen = window.innerWidth <= smallScreenBreakpoint;

         if (isSmallScreen) {{
             initialViewClass = 'view-single';
         }} else if (viewParam && validViewClasses.includes(viewParam)) {{
             initialViewClass = viewParam;
         }} else {{
             initialViewClass = 'view-hsplit'; // Default to horizontal split on larger screens
         }}

        setView(initialViewClass, false); // Set initial view without updating URL yet

        // Re-check language state AFTER setView potentially changed the view class
        if (body.classList.contains('view-single') && langParam === 't') {{
            if (!body.classList.contains('show-t')) {{ // Check if not already set by setView
                body.classList.add('show-t');
            }}
            toggleLangBtn.textContent = 'Chinese'; // Ensure button text is correct
        }}

        // Update URL state once everything is initialized
        updateURLState(getCurrentViewClass());
    }}

    function handleResize() {{
         const isSmallScreen = window.innerWidth <= smallScreenBreakpoint;
         const currentView = getCurrentViewClass();
         const urlParams = new URLSearchParams(window.location.search);
         const viewParam = urlParams.get('view');

         if (isSmallScreen && currentView !== 'view-single') {{
             console.log("Resized small, forcing single view");
             setView('view-single', true, true);
         }} else if (!isSmallScreen && currentView === 'view-single') {{
             // Only switch away from single if it wasn't explicitly requested via URL
             if (viewParam !== 'view-single') {{
                 console.log("Resized large from single view, switching to horizontal");
                 setView('view-hsplit', true, true);
             }}
         }}
     }}

    if (viewHsplitBtn) {{ viewHsplitBtn.addEventListener('click', () => setView('view-hsplit', true)); }}
    if (viewVsplitBtn) {{ viewVsplitBtn.addEventListener('click', () => setView('view-vsplit', true)); }}
    if (viewSingleBtn) {{ viewSingleBtn.addEventListener('click', () => setView('view-single', true)); }}

    toggleLangBtn.addEventListener('click', toggleLanguage);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('DOMContentLoaded', initializeView);
    window.addEventListener('resize', handleResize);

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

def write_css_file(css_path, content):
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

def process_directory_pair(base_dir_path, t_dir_path, final_dir_path):
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

    title_regex = re.compile(r"(\d{4})\s*[-_]?\s*(\d+)(?:[-_].*)?")

    for i, base_file_path in enumerate(base_md_files):
        base_filename_stem = base_file_path.stem
        print(f"  Processing file ({i+1}/{len(base_md_stems)}): {base_file_path.name} -> {base_filename_stem}.html")

        display_title = base_filename_stem
        match = title_regex.match(base_filename_stem)
        if match:
            year, issue_num = match.groups()
            display_title = f"{year} - n{int(issue_num):02d}"
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

def main():
    current_dir = Path('.')
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
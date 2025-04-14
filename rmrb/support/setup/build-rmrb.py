#!/usr/bin/env python3
import os
import json
import re
import gzip # Import the gzip library
import shutil # Import shutil for efficient file copying in gzip

# Directory containing the issue subfolders (e.g., YYYY.MM)
root_dir = "issues"
# Directory where the output JS and GZ files will be saved
output_dir = "output_js"

# --- Function to extract metadata and content (same as before) ---
def extract_metadata(file_path):
    """
    Extracts metadata (Title, Author, Date, Page Number) and content
    from the beginning of a file, ignoring blank lines.
    """
    metadata = {'title': '', 'author': '', 'date': '', 'page_number': ''}
    content_lines = []
    lines_processed_for_metadata = 0
    metadata_found_count = 0
    max_metadata_lines_to_check = 10 # Look for metadata in the first 10 non-blank lines

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()

        content_start_index = 0
        non_blank_lines_checked = 0

        for i, line in enumerate(all_lines):
            content_start_index = i + 1 # Assume content starts after this line
            stripped_line = line.strip()

            if not stripped_line: # Skip blank lines
                continue

            non_blank_lines_checked += 1

            if non_blank_lines_checked > max_metadata_lines_to_check:
                 # If we've checked enough lines without finding all metadata, assume rest is content
                 content_start_index = i # Content started at the current line
                 break

            if stripped_line.startswith("Title:") and not metadata['title']:
                metadata['title'] = stripped_line[len("Title:"):].strip()
                metadata_found_count += 1
            elif stripped_line.startswith("Author:") and not metadata['author']:
                metadata['author'] = stripped_line[len("Author:"):].strip()
                # Author is optional, so don't increment metadata_found_count strictly
            elif stripped_line.startswith("Date:") and not metadata['date']:
                metadata['date'] = stripped_line[len("Date:"):].strip()
                metadata_found_count += 1
            elif (stripped_line.startswith("Edition:") or stripped_line.startswith("Page:")) and not metadata['page_number']:
                 prefix = "Edition:" if stripped_line.startswith("Edition:") else "Page:"
                 metadata['page_number'] = stripped_line[len(prefix):].strip()
                 metadata_found_count += 1
                 # Assume content starts after the page/edition line
                 break # Stop metadata search after finding page number

            # Break early if we found title, date, and page number
            if metadata['title'] and metadata['date'] and metadata['page_number']:
                 break


        # Fallback: If Date not found in metadata, extract from filename
        if not metadata['date']:
             filename = os.path.basename(file_path)
             date_match = re.match(r'(\d{4}-\d{2}-\d{2})_', filename)
             if date_match:
                 metadata['date'] = date_match.group(1)

        # Fallback: If Title not found, use filename part
        if not metadata['title']:
            filename = os.path.basename(file_path)
            # Remove date and extension
            title_part = re.sub(r'^\d{4}-\d{2}-\d{2}_', '', filename)
            title_part = os.path.splitext(title_part)[0]
            metadata['title'] = title_part.replace('_', ' ') # Replace underscores

        content = "".join(all_lines[content_start_index:]).strip()
        return metadata, content

    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        return None, None

# --- Main script execution ---

# Check if root_dir exists
if not os.path.isdir(root_dir):
    print(f"Error: Root directory '{root_dir}' not found.")
    exit(1)

# Create the output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)
print(f"Output directory: '{output_dir}'")

# Get issue subdirectories (YYYY.MM format)
issue_dirs = []
for item in os.listdir(root_dir):
    item_path = os.path.join(root_dir, item)
    if os.path.isdir(item_path) and re.match(r'^\d{4}\.\d{2}$', item):
        issue_dirs.append(item)

# Sort issue directories chronologically
issue_dirs.sort()

total_articles_processed = 0

# Process each issue directory
for issue_dir_name in issue_dirs:
    dirpath = os.path.join(root_dir, issue_dir_name)
    filenames = os.listdir(dirpath)
    articles_in_issue = [] # List to hold articles for the current issue

    print(f"\nProcessing directory: {issue_dir_name}...")

    # Get all text and markdown files and sort them
    article_files = [f for f in filenames if f.lower().endswith(('.txt', '.md'))]
    article_files.sort()

    # Process each article file in the current issue directory
    for filename in article_files:
        file_path = os.path.join(dirpath, filename)
        relative_path_in_issue = filename

        metadata, content = extract_metadata(file_path)

        if metadata is not None:
            article_data = {
                'path': os.path.join(issue_dir_name, filename).replace('\\', '/'),
                'title': metadata['title'],
                'author': metadata['author'],
                'date': metadata['date'],
                'page_number': metadata['page_number'],
                'content': content
            }
            articles_in_issue.append(article_data)
            total_articles_processed += 1

    # Write the collected articles for this issue to its JS file
    if articles_in_issue:
        output_js_filename = f"{issue_dir_name}.js"
        output_js_filepath = os.path.join(output_dir, output_js_filename)
        output_gz_filepath = f"{output_js_filepath}.gz" # Define GZ filepath

        js_written = False
        try:
            with open(output_js_filepath, "w", encoding="utf-8") as out:
                out.write("const ARTICLES = ")
                json.dump(articles_in_issue, out, indent=2, ensure_ascii=False)
                out.write(";")
            print(f"  -> Successfully processed {len(articles_in_issue)} articles into {output_js_filepath}")
            js_written = True
        except Exception as e:
            print(f"  -> Error writing output file {output_js_filepath}: {e}")

        # Create the GZ file if the JS file was written successfully
        if js_written:
            try:
                with open(output_js_filepath, 'rb') as f_in:
                    with gzip.open(output_gz_filepath, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                print(f"  -> Successfully created compressed file {output_gz_filepath}")
            except Exception as e:
                print(f"  -> Error creating compressed file {output_gz_filepath}: {e}")

    else:
        print(f"  -> No articles found or processed in {issue_dir_name}.")

print(f"\nFinished processing. Total articles processed: {total_articles_processed}")

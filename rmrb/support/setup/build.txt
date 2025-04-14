#!/usr/bin/env python3
import os
import json
import re

output_file = "data.js"
pdfs_output_file = "pdfs.js"  # New output file for PDFs
root_dir = "."  # base folder containing all issue folders

# Directories to ignore
ignore_dirs = ["search-files", "automated-translation"]

# Article metadata structure
# { 'path': str, 'issue': str, 'issue_number': str, 'date': str, 'title': str, 'author': str, 'type': str, 'content': str }
articles = []

# PDF information structure
# { 'issue': str, 'path': str }
pdfs = []

# Pattern to match the metadata section in the article files
metadata_pattern = re.compile(
    r'잡지명\s+(.*?)\n'
    r'발행일\s+(.*?)\n'
    r'기사제목\s+(.*?)(?:\n필자\s+(.*?))?(?:\n기사형태\s+(.*?))?(?:\n\n)(.*)',
    re.DOTALL
)

# Get all subdirectories (excluding ignored ones)
all_dirs = []
for dirpath, dirnames, filenames in os.walk(root_dir):
    # Skip the root directory (current directory)
    if dirpath == root_dir:
        continue
    
    # Skip ignored directories
    rel_dir = os.path.relpath(dirpath, root_dir)
    if any(ignore_dir in rel_dir.split(os.sep) for ignore_dir in ignore_dirs):
        continue
    
    # Skip non-issue directories
    if not any(filename.endswith('.txt') for filename in filenames):
        continue
    
    all_dirs.append(rel_dir)

# Sort all directories
all_dirs.sort()

# Process each directory in sorted order
for rel_dir in all_dirs:
    dirpath = os.path.join(root_dir, rel_dir)
    
    # Get the issue name from directory name
    issue_match = re.search(r'(\d+)호\s+(\d+\.\d+)', rel_dir)
    issue_new_match = re.search(r'신간\s+(\d+)호\s+(\d+)', rel_dir)
    issue_restored_match = re.search(r'복간\s+(\d+)호\s+(\d+\.\d+)', rel_dir)
    
    issue_name = rel_dir
    issue_number = ""
    
    if issue_match:
        issue_number = issue_match.group(1)
    elif issue_new_match:
        issue_number = f"신간 {issue_new_match.group(1)}"
    elif issue_restored_match:
        issue_number = f"복간 {issue_restored_match.group(1)}"
    
    # Get all files in the directory
    filenames = os.listdir(dirpath)
    
    # Check for PDF files and save the info for the first one found (sorted)
    pdf_files = [f for f in filenames if f.lower().endswith('.pdf')]
    if pdf_files:
        pdf_files.sort()  # Sort the PDF files
        pdf_path = os.path.join(rel_dir, pdf_files[0])
        pdfs.append({"issue": issue_name, "path": pdf_path})
    else:
        # If no PDF found, store an empty path
        pdfs.append({"issue": issue_name, "path": ""})
    
    # Get all text files and sort them
    txt_files = [f for f in filenames if f.endswith('.txt') and f not in ['full.txt', 'index.md', 'word_frequency.tsv', 'word_frequency.txt']]
    txt_files.sort()
    
    # Process each text file in sorted order
    for filename in txt_files:
        try:
            file_path = os.path.join(dirpath, filename)
            with open(file_path, encoding="utf-8") as f:
                text = f.read()
                
                # Try to extract metadata
                metadata_match = metadata_pattern.search(text)
                
                article = {
                    'path': os.path.join(rel_dir, filename),
                    'issue': issue_name,
                    'issue_number': issue_number,
                    'content': text,
                }
                
                if metadata_match:
                    # Extract metadata
                    article.update({
                        'magazine': metadata_match.group(1).strip(),
                        'date': metadata_match.group(2).strip(),
                        'title': metadata_match.group(3).strip(),
                        'author': metadata_match.group(4).strip() if metadata_match.group(4) else "",
                        'type': metadata_match.group(5).strip() if metadata_match.group(5) else "",
                        'content': metadata_match.group(6).strip()
                    })
                else:
                    # If metadata pattern doesn't match, keep the full content
                    article.update({
                        'magazine': '',
                        'date': '',
                        'title': f'Article {filename}',
                        'author': '',
                        'type': '',
                    })
                
                articles.append(article)
                
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

# Write to data.js
with open(output_file, "w", encoding="utf-8") as out:
    out.write("const ARTICLES = ")
    json.dump(articles, out, indent=2, ensure_ascii=False)
    out.write(";")

# Write to pdfs.js
with open(pdfs_output_file, "w", encoding="utf-8") as out:
    out.write("const PDFS = ")
    json.dump(pdfs, out, indent=2, ensure_ascii=False)
    out.write(";")

print(f"Successfully processed {len(articles)} articles into {output_file}")
print(f"Successfully processed {len(pdfs)} issue PDF references into {pdfs_output_file}")

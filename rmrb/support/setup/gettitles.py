#!/usr/bin/env python3

import os

def extract_fields(file_path):
    title = ''
    author = ''
    article_type = ''

    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.rstrip('\n')
            if line.startswith('기사제목\t'):
                title = line[len('기사제목\t'):]
            elif line.startswith('필자\t'):
                author = line[len('필자\t'):]
            elif line.startswith('기사형태\t'):
                article_type = line[len('기사형태\t'):]
    return title, author, article_type

def main():
    with open('titles.txt', 'w', encoding='utf-8') as out_f:
        subdirs = sorted([d for d in os.listdir('.') if os.path.isdir(d)])
        for subdir in subdirs:
            txt_files = [
                f for f in os.listdir(subdir)
                if f.endswith('.txt') and f != 'full.txt'
            ]
            sorted_files = sorted(txt_files)
            for filename in sorted_files:
                file_path = os.path.join(subdir, filename)
                file_id = os.path.splitext(filename)[0]
                title, author, article_type = extract_fields(file_path)
                if title == '':
                    out_f.write(f"{subdir}\t{file_id}\tTITLE NOT FOUND\n")
                else:
                    out_f.write(f"{subdir}\t{file_id}\t{title}\t{author}\t{article_type}\n")

if __name__ == '__main__':
    main()

# Chinese Translated Periodicals Archive

Welcome to this project, an experiment to use large language models (generative AI) to produce, at large scale, translations of the raw text of a selection of issues of a few Chinese periodicals. 

These translations must be treated with care: they have not been checked by a human. Their accuracy must be checked. If you find an article of interest and don't know enough Chinese to check the original yourself, consider trying various other translation tools such as DeepL or Google Translate, or online dictionaries to confirm the content. Also: the Chinese originals are OCRs of original documents and may contain many errors themselves. More technical notes will be added here later.

**人民日报**

The raw text for the newspaper was taken from <a href="https://github.com/fangj/rmrb">this repository</a>. Not much is known about where this raw text came from or how it was extracted from the original newspaper issues. The translations for the newspaper were carried out using Mistral Small 3.1, in April, 2025. Some of the earliest issues were done with Google Gemini 2.0 Flash and included a request to extract named entities, but when switching to Mistral, results of this were less satisfactory and this feature was removed. The translation prompt that was used can be found <a href="prompt.txt">here</a>. 

**Shortcuts**

When viewing an article you can use the left or right arrows on your keyboard to move quickly from one article to another inside a given issue. On a mobile device you can swipe left or right to do the same. 

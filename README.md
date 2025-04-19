# Chinese Translated Periodicals Archive

Welcome to this project, an experiment to use large language models (generative AI) to produce, at large scale, translations of the raw text of a selection of issues of a few Chinese periodicals. 

These translations must be treated with care: they have not been checked by a human. Their accuracy must be checked. If you find an article of interest and don't know enough Chinese to check the original yourself, consider trying various other translation tools such as DeepL or Google Translate, or online dictionaries to confirm the content. Also: the Chinese originals are OCRs of original documents and may contain many errors themselves. More technical notes will be added here later.

## 人民日报

The raw text for *The People's Daily* (Renmin ribao) newspaper was found on [this repository](https://github.com/fangj/rmrb). Not much is known about where this raw text came from or how it was extracted from the original newspaper issues. The translations for the newspaper were carried out using Mistral Small 3.1, in April, 2025. Some of the earliest issues were done with Google Gemini 2.0 Flash and included a request to extract named entities, but when switching to Mistral, results of this were less satisfactory and this feature was removed. The translation prompt that was used can be found [here](prompt-rmrb.txt). 

## 申報

The raw text for *Shenbao*, an important Shanghai newspaper was found on [this repository](https://github.com/moss-on-stone/shenbao-txt). Little is known about this source, but it uses a similar issue naming scheme as the scanned issues of the newspaper that can [be found on the Internet Archvie](https://archive.org/details/shenbao-archive). This raw text collection appears to have more OCR errors than *The People's Daily*, with mistaken characters here and there. 

Translation of this was done through Google Gemini Flash 2.0 with a prompt that can be found [here](prompt-shenbao.txt). The texts were long and broken up into many pieces due to occasional experience with corrupted output (input context is huge for this LLM, but output sometimes struggles with longer outputs). It wouldn't be surprising to find that there are issues in there that are missing some articles etc. The thousands of translated articles have not been indexed and matched up with the originals so a different interface was created that allows a user to browse the Chinese and English side by side. Also, given the very large size of each issue, loading many issues into memory, which *The People's Daily* interface does (a month at a time) was not practical for *Shenbao* and all the pages are just flat web pages loaded separately.

## LLM Translations

The translations here are part of an experiment with using LLMs for large scale translations of historical sources. However, these translations suffer from all the usual issues with generative AI: hallucinations, incomplete answers, inconsistent behavior, and of course, the imperfections of a translation performed without human supervision.

*Does the usefulness of these translations outweigh problems they pose? How bad or good are these translations really? What do they struggle with and what do they do well? These are questions I hope that students and researchers will consider as they explore the translations included here.*

Some examples of issues already found:

*Example One:* Some of the *Shenbao* issues seem to have all the article contents translated but not their headlines. Some of these have been fixed, but not all issues have been checked yet. 

*Example Two:* Some *Shenbao* issues look fine and incomplete, but decided to upgrade sub-headings within an article to article headline.

*Example Three:* Most of the 1966-1968 issues of *The People's Daily* decided to not translate the Xinhua information and date at the very beginning of articles. This was only fixed late in the translations when the prompt was updated to emphasize the importance of this information. for those who can read Chinese, they are still visible in the originals.

*Example Four:* In skimming through the files, what appear to be otherwise decent translations will have one key word translated into an English word that certainly matches the original in some contexts but definitely not the one the article is using it for.

*Example Five:* The *Shenbao* issues, which are often very long, were broken up into 7-20 pieces and translated seperately. This reduced the chance that the LLM would return incomplete translations due to the high number of output tokens. However, some pieces came back missing articles, or came back empty, as if the LLM refused to engage with the content. One possibility might be that some of the content of the newspaper (which often describes violence in Shanghai) may have triggered safety barriers for the LLM. 

If you are student who does not know Chinese and you are browsing these articles, any use of them for your research should really take the original for a given article and run it through, ideally, several other online translation engines (DeepL, Google Translate, some more recent LLMs by the time you read this) and compare the different ways the same relevant sentences get translated there. 

## Shortcuts

When viewing an article you can use the left or right arrows on your keyboard to move quickly from one article to another inside a given issue. On a mobile device you can swipe left or right to do the same. If you change view in a *Shenbao* article, you may need to click on the screen before the keyboard shortcuts work again.
---
name: content-humanizer
description: Makes Puddle's copy read as written rather than generated. Use when writing or editing UI text, buttons, empty states, error messages, docs, or the README.
---

# Content humanizer

Puddle's copy should sound like one engineer telling another what happened. Short, plain,
specific. The reader is mid-query and wants the sentence to end.

Apply this to every user-facing string: buttons, labels, tooltips, empty states, errors,
docs, README.

## Plain verbs

Use the verb a person would say out loud. Latinate and compound verbs add syllables and
subtract meaning.

| Instead of | Write |
| --- | --- |
| utilize, leverage | use |
| facilitate, enable | let, or name the thing it does |
| perform a query execution | run the query |
| initiate, commence | start |
| terminate | stop |
| is able to | can |

The same goes for nouns: "query speed", not "query performance characteristics".

## Sentence case

Sentence case everywhere: buttons, headings, labels, menu items. "Copy share link", not
"Copy Share Link". Capitalise proper nouns and nothing else: SQL, DuckDB, Parquet, CSV.

Skip the terminal period on buttons and labels. Keep it in real sentences.

## Active voice

Name who did the thing. Passive voice is how software avoids saying a query failed.

- "The query failed" beats "an error was encountered".
- "Puddle could not read that file" beats "the file could not be processed".
- "You have not run this query yet" beats "this query has not been executed".

Errors say what happened, then what to do:

> Could not parse `sales.csv` at row 412: the column count changed. Check the delimiter,
> or open it as raw text.

## Cut filler

Delete anything that would survive its own removal. Openers that warm up before starting
("in order to", "it's worth noting that", "simply", "just", "seamlessly", "powerful",
"robust", "effortlessly"). Hedges that apologise for the product ("might possibly",
"we think you'll find"). Whole sentences restating the heading above them.

Two habits give away generated copy: the rule of three where two items would do
("fast, simple, and intuitive"), and the em-dash pivot into a grand restatement
("not just a notebook, a new way to think about data"). Say the one true thing instead.

Adjectives earn their place by being falsifiable. "Runs in the tab" is checkable;
"blazingly fast" is not.

## Buttons say what happens

A button names its effect, so the reader knows the outcome before clicking.

| Instead of | Write |
| --- | --- |
| Submit | Run query |
| OK | Delete notebook |
| Get started | Open a CSV |
| Learn more | Read the DuckDB docs |
| Continue | Save and close |

Destructive actions name the destruction: "Replace dataset", not "Confirm". If a label
needs a tooltip to explain what it does, the label is wrong.

## Read it back

Before shipping any string, read it aloud. Copy that you would not say to a colleague
gets rewritten. Then check:

- Every claim is true of what Puddle actually does today.
- The first sentence carries the point; nothing warms up to it.
- No sentence survives having its adjectives removed only to lose nothing.
- Length is the shortest that stays clear and stays accurate.

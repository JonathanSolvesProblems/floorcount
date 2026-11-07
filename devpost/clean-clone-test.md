# Fresh-clone test

What happens when someone who is not me gets this repository and opens it. Run on 6 November 2026 from the public GitHub repository, on Windows 11 with Lens Studio 5.23.2. Results are for commit `7e5fa87`. The commits after it change only documents and this file: the Lens, its tests and the packages are byte for byte the same. It runs again if any of those change before submission.

## What was done

1. `git clone` from GitHub into an empty folder outside my project.
2. The ZIP from GitHub's Download ZIP button, checked file by file.
3. `ARSpec.esproj` from the clone opened in a freshly started Lens Studio.
4. Every LEAF scenario run once, in order, in the preview, on the clone.

## Results

| Check | Result |
|---|---|
| Files in the clone | 231 |
| Binaries that are Git LFS pointers and not files | 0 in the clone, 0 of 55 in the ZIP |
| Lens Studio opens the project | Yes, after one prompt (below) |
| TypeScript compiles | Yes, clean |
| The Lens starts | Yes: "Floorcount: session started, Basic step at Slow (140 BPM)", no Floorcount errors |
| LEAF scenarios | **17 of 17 pass, no retries** |
| Beat test on the clone | 127 samples over 8 seconds, no wrong print, nothing lit on a hold, 139.6 BPM |
| GitHub Actions on the same commit | Passes: unit tests, planted breaks, repository checks |

The number of samples depends on how fast the preview is running on the day. The result is the same: no wrong print, on tempo.

## The one prompt

On the first open, Lens Studio shows a dialog titled "Loading Icon Atlas" that says "Requesting permission(s) to access: filesystem", with the buttons **Trust and Load** and **Block**. It is asking about an editor plugin that ships inside Snap's Icons package and sits in `Plugins/`. Nothing loads until it is answered.

The Lens does not use that plugin. I answered **Block**, and the project loaded and compiled. Either answer works.

This cost half an hour the first time. A build session had opened the clone, the dialog came up behind it, and the MCP stopped answering because the editor was waiting for a click. From outside it looked like a hang on "Loading Icon Atlas". Reading the dialog through Windows accessibility showed what it was.

## What Lens Studio changes in a clone

Opening the project makes Lens Studio rewrite its own generated block in `.gitignore`, re-extract the Icon Atlas plugin files with Windows line endings, and create `Cache/`, `Support/`, some editor config files and a signing key (`spk_debug_key.pem`). `git status` can show `.gitignore`, `.gitattributes` and the plugin files as modified after an open. None of it changes the Lens.

## Steps for the README

Taken from this test into the README's "How to run it":

1. Clone, or use Download ZIP. No Git LFS needed.
2. Open `ARSpec.esproj` in Lens Studio 5.23.2.
3. Answer the "Loading Icon Atlas" prompt. Either button.
4. Wait for the import, a few minutes at most.
5. Preview panel: SPECS device, Interactive Preview.

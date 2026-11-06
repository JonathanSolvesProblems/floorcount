# Fresh-clone test

What happens when someone who is not me gets this repository and opens it. Run on 6 November 2026 against commit `34fea9d`, on Windows 11 with Lens Studio 5.23.2. It will be run again on the commit that is submitted, and this file updated.

## What was done

1. `git clone` of the repository into an empty folder outside OneDrive, with no Git LFS installed for it.
2. The same commit exported as a ZIP with `git archive`, to stand in for GitHub's Download ZIP.
3. `ARSpec.esproj` from the clone opened in a freshly started Lens Studio.

## Results

| Check | Result |
|---|---|
| Files in the clone | 190 |
| Binaries that are Git LFS pointers and not files | 0, in the clone and in the ZIP |
| Lens Studio opens the project | Yes, after one prompt (below) |
| First open, importing assets | About 3 minutes on a laptop |
| TypeScript compiles | Yes. All Floorcount scripts and LEAF scenarios are in the compiled output |
| LEAF scenarios run from the clone | Not run yet. They pass in the working project (see `design-pass-report.md`) |

## The one prompt

On the first open, Lens Studio shows a dialog titled "Loading Icon Atlas" that says "Requesting permission(s) to access: filesystem", with the buttons **Trust and Load** and **Block**. It is asking about an editor plugin that ships inside Snap's Icons package and sits in `Plugins/`. Nothing loads until it is answered.

The Lens does not use that plugin. I answered **Block**, and the project loaded and compiled a few seconds later. Either answer works.

This cost half an hour the first time. A CLAD session had opened the clone through the MCP, the dialog came up behind it, and the MCP stopped answering because the editor was waiting for a click. From outside it looked like a hang on "Loading Icon Atlas". Reading the dialog through Windows accessibility showed what it was.

## What Lens Studio changes in a clone

Opening the project makes Lens Studio rewrite its own generated block in `.gitignore`, re-extract the Icon Atlas plugin files with Windows line endings, and create `Cache/`, `Support/` and a signing key (`spk_debug_key.pem`), all of which are ignored. `git status` shows `.gitignore`, `.gitattributes` and the plugin files as modified after an open. None of it changes the Lens.

## Steps for the README

Taken from this test into the README's "How to run it":

1. Clone, or use Download ZIP. No Git LFS needed.
2. Open `ARSpec.esproj` in Lens Studio 5.23.2.
3. Answer the "Loading Icon Atlas" prompt. Either button.
4. Wait for the import, a few minutes the first time.
5. Preview panel: SPECS device, Interactive Preview.

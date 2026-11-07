# Build log

Every CLAD session that built, designed or tested Floorcount, counted from the sessions' own transcripts. The prompts each session was given are in [PROMPTS.md](PROMPTS.md), word for word.

The first session, on 1 November, ran inside the planning chat and its transcript was not kept, so it is described but not counted: it wrote the first seven scripts and generated the music and sound, and its scene was lost because the project was never saved. Every later session saves through the Editor API at each milestone for that reason.

| When | Session | What it did | Minutes | Tool calls | Lens Studio MCP calls |
|---|---|---|---|---|---|
| 1 Nov | First build | Scripts, generated music and sound. Scene lost, not counted. | n/a | not kept | not kept |
| 2 Nov, 14:19 | Build | Rebuilt the scene from the brief on the scripts and audio of 1 November, wrote six LEAF scenarios, rewrote the beat clock. | 48 | 224 | 112 |
| 2 Nov, 15:10 | Design pass (cut off) | Brought the fonts and textures in, then stopped at a usage limit before touching the scene. | 6 | 43 | 3 |
| 2 Nov, 15:19 | Design pass | Applied the design notes: sole prints, the clave strip, one ink, the brightness curve, the card without a panel. | 52 | 266 | 94 |
| 2 Nov, 16:13 | Step card fix (cut off) | Started the card fix, stopped at a usage limit with one script half-written and nothing saved. | 14 | 55 | 10 |
| 3 Nov, 07:42 | Step card fix | One left edge, fitted capsules, the paused line in words, a seventh scenario. | 39 | 209 | 97 |
| 3 Nov, 08:23 | Polish | The arrow stays away while the card is read, one weight on the card, a bigger strip. | 31 | 185 | 76 |
| 6 Nov, 09:12 | Validation | Compiled and ran every scenario after the one-answer-per-8-count guard, reworked the eighth scenario that tests it, removed four unused icons. | 39 | 128 | 53 |
| 6 Nov, 09:53 | Fresh-clone test (stopped) | Cloned the repository, checked it for Git LFS pointers and opened it in Lens Studio. The editor was waiting on a plugin trust prompt the session could not see, so I stopped it and answered the prompt by hand. See clean-clone-test.md. | 33 | 45 | 6 |
| 6 Nov, 10:30 | Session memory and coverage (cut off) | Verified the session memory and the arc fix in the Lens and wrote nine new scenarios, all passing. Stopped at a usage limit while chasing a race in C4. | 43 | 174 | 73 |
| 6 Nov, 13:53 | Coverage, finished | Ran the whole sweep after the C4 fix, took the captures, checked a saved session across a real preview reset. | 38 | 190 | 79 |
| 6 Nov, 14:34 | Preview capture (stopped) | Stopped by hand a few minutes in, before any clip was recorded. | 11 | 73 | 9 |
| 6 Nov, 16:30 | Preview capture (cut off) | Recorded the seven clips of the Lens and retook the summary still. Stopped at its turn limit. | 47 | 227 | 51 |
| 6 Nov, 17:18 | Capture, finished | Recorded the two clips of Lens Studio itself, cleared the saved session, wrote the clip notes. | 8 | 52 | 14 |
| 6 Nov, 17:59 | Fresh-clone sweep | Ran all 17 LEAF scenarios on a fresh clone of the public repository: 17 of 17, no retries. | 8 | 40 | 35 |
| 6 Nov, 18:15 | Preview capture, more (cut off) | Recorded the arrow and count-hiding clips through the real answer guard. Lens Studio crashed on the third clip. | 13 | 83 | 19 |
| 6 Nov, 18:32 | Review fixes | Compiled and swept the Lens after the fixes from an independent code review, extended the answer-guard scenario, checked the fade line in a running session. | 42 | 131 | 53 |
| 6 Nov, 20:35 | Answer guard rerun | Reran the answer-guard scenario on a free GPU. One pass, one fail, which traced to the scenario, not the Lens. | 7 | 30 | 16 |
| 6 Nov, 20:51 | Fresh-clone sweep (stopped) | Found the working project still holding the MCP and stopped before running anything, rightly. | 2 | 10 | 2 |
| 6 Nov, 21:15 | Fresh-clone sweep, final | All 17 LEAF scenarios on a fresh clone of the public repository, with the answer-guard scenario three times: 17 of 17, no retries. | 9 | 44 | 37 |
| 7 Nov, 17:54 | Gallery recapture | Retook the summary from two real practices and the last-time frame with the title, strip and both rings in view. | 16 | 72 | 25 |
| 7 Nov, 18:12 | Answer window sweep (stopped) | Stopped by hand a few minutes in so one sweep could cover the next review's fixes too. | 3 | 29 | 14 |
| 7 Nov, 18:15 | Answer window | Swept the Lens after the answer guard moved to a fixed window with a grace, from a second code review: 17 of 17. | 32 | 78 | 45 |
| 7 Nov, 18:48 | Answer guard, off the seam | Reran the answer-guard scenario four times after moving its pause off the loop seam: four of four. | 7 | 33 | 17 |
| | **Counted total** | 23 sessions | 548 | **2421** | **940** |

## What the Lens Studio MCP was used for

| MCP tool | Calls |
|---|---|
| `run_leaf_scenario` | 286 |
| `PreviewPanelTool` | 120 |
| `MovePreviewCamera` | 120 |
| `RunAndCollectLogsTool` | 104 |
| `ExecuteEditorCode` | 93 |
| `RecompileTypeScriptTool` | 64 |
| `asset-graphql` | 38 |
| `list_leaf_scenarios` | 27 |
| `open_leaf_panel` | 20 |
| `scene-graphql` | 16 |
| `CapturePanelScreenshotTool` | 15 |
| `set_leaf_execution_target` | 12 |
| `ListAllPanels` | 7 |
| `VirtualScene` | 6 |
| `ListInstalledPackagesTool` | 4 |
| `SearchLensStudioAssetLibrary` | 2 |
| `QueryRuntimeSceneTool` | 2 |
| `InjectPreviewGesture` | 2 |
| `InstallLensStudioPackage` | 1 |
| `PreviewInteractTool` | 1 |

Two of these tools are on every later prompt's do-not-call list, and the table still shows them. The two `QueryRuntimeSceneTool` calls and the one `InstallLensStudioPackage` call are from the 2 November build session. The install was LEAF itself, which the Lens needed. The scene query silently installed a second package that broke the TypeScript build, which is how that rule got onto every prompt after it. The one `PreviewInteractTool` call, on 3 November, did the same, and joined the list.

Five sessions were cut off partway through by a usage or turn limit or a crash, three were stopped by hand, and one stopped itself on finding the wrong project open. All nine are listed and counted, including the ones that went wrong. Each session after a cut-off began by reading what the last one had written.

# Build log

Every CLAD session that built, designed or tested Floorcount, counted from the sessions' own transcripts. The prompts each session was given are in [PROMPTS.md](PROMPTS.md), word for word.

The first session, on 1 November, ran inside the planning chat and its transcript was not kept, so it is described but not counted: it wrote the first seven scripts and generated the music and sound, and its scene was lost because the project was never saved. Every later session saves through the Editor API at each milestone for that reason.

| When | Session | What it did | Minutes | Tool calls | Lens Studio MCP calls |
|---|---|---|---|---|---|
| 1 Nov | First build | Scripts, generated music and sound. Scene lost, not counted. | n/a | not kept | not kept |
| 2 Nov, 14:19 | Build | Rebuilt the scene from the brief on the scripts and audio of 1 November, wrote six LEAF scenarios, rewrote the beat clock. | 48 | 224 | 112 |
| 2 Nov, 15:09 | Design pass (cut off) | Brought the fonts and textures in, then stopped at a usage limit before touching the scene. | 7 | 43 | 3 |
| 2 Nov, 15:19 | Design pass | Applied the design notes: sole prints, the clave strip, one ink, the brightness curve, the card without a panel. | 52 | 266 | 94 |
| 2 Nov, 16:13 | Step card fix (cut off) | Started the card fix, stopped at a usage limit with one script half-written and nothing saved. | 14 | 55 | 10 |
| 3 Nov, 07:42 | Step card fix | One left edge, fitted capsules, the paused line in words, a seventh scenario. | 39 | 209 | 97 |
| 3 Nov, 08:23 | Polish | The arrow stays away while the card is read, one weight on the card, a bigger strip. | 31 | 185 | 76 |
| 6 Nov, 09:12 | Validation | Compiled and ran every scenario after the one-answer-per-8-count guard; removed four unused icons. | 39 | 128 | 53 |
| 6 Nov, 09:53 | Fresh-clone test (stopped) | Cloned the repository, checked it for Git LFS pointers and opened it in Lens Studio. The editor was waiting on a plugin trust prompt the session could not see, so I stopped it and answered the prompt by hand. See clean-clone-test.md. | 33 | 45 | 6 |
| 6 Nov, 10:30 | Session memory and coverage (cut off) | Verified the session memory and the arc fix in the Lens and wrote nine new scenarios, all passing. Stopped at a usage limit while chasing a race in C4. | 43 | 174 | 73 |
| 6 Nov, 13:53 | Coverage, finished | Ran the whole sweep after the C4 fix, took the captures, checked a saved session across a real preview reset. | 38 | 190 | 79 |
| | **Counted total** | 10 sessions | 344 | **1519** | **603** |

## What the Lens Studio MCP was used for

| MCP tool | Calls |
|---|---|
| `run_leaf_scenario` | 163 |
| `MovePreviewCamera` | 85 |
| `PreviewPanelTool` | 84 |
| `ExecuteEditorCode` | 58 |
| `RecompileTypeScriptTool` | 52 |
| `RunAndCollectLogsTool` | 51 |
| `asset-graphql` | 38 |
| `scene-graphql` | 16 |
| `list_leaf_scenarios` | 16 |
| `CapturePanelScreenshotTool` | 11 |
| `open_leaf_panel` | 7 |
| `VirtualScene` | 6 |
| `ListInstalledPackagesTool` | 4 |
| `ListAllPanels` | 3 |
| `SearchLensStudioAssetLibrary` | 2 |
| `QueryRuntimeSceneTool` | 2 |
| `InjectPreviewGesture` | 2 |
| `InstallLensStudioPackage` | 1 |
| `PreviewInteractTool` | 1 |
| `set_leaf_execution_target` | 1 |

Three sessions were cut off by a usage limit partway through, and one was stopped by hand. All four are listed and counted, because a count that leaves out the runs that went wrong is not a count. Each session after a cut-off began by reading what the last one had written.

# Sources for the page's claims

Each claim on the Devpost page (`submission.md`), traced to where it comes from.

- Viewing perspective study: Versace et al., "Enhancing dance learning by optimising instructional perspective: A preregistered study on the effect of dancers' viewing perspective, cognitive load and expertise", PLOS ONE 21(9), 2026. https://doi.org/10.1371/journal.pone.0355860
- Arthur Murray's mail-order footprints, about 1920: https://www.fundinguniverse.com/company-histories/arthur-murray-international-inc-history/
- Dance Reality, 2017: https://www.uploadvr.com/arkit-app-uses-virtual-footsteps-show-dance/ (16 July 2017) and https://www.geekwire.com/2017/dance-reality-app-helps-users-get-footwork-augmented-reality-thanks-apples-arkit/ (the App Store listing, id1277367395, returned 404 on 7 November 2026)
- "The single biggest hurdle new dancers face" (hearing where the 1 falls): Robin Campbell, "How Salsa Music Is Counted (Why Dancers Say 1-2-3, 5-6-7)", The Dance Dojo, 12 June 2026. https://thedancedojo.com/blog/how-salsa-music-is-counted/ Campbell founded The Dance Dojo, an online salsa and bachata school (Baila Room podcast, episode 50). The choice of a click on 1 and 5 over the clave pattern is mine; a pseudonymous 2015 Son y Casino post, "Against clave", makes the same case for following the conga instead: https://sonycasino.com/2015/06/20/against-clave-why-this-instrument-may-not-be-the-best-one-in-helping-you-keep-a-beat/
- The video's opener card ("13 min with a phone tutorial, 3 times the same 4:28 video, 2 walks to the phone to restart it, 4 min of music to dance to"): one real practice on 8 November 2026, measured from the phone's screen recording and the room camera, written up with timestamps in `devpost/phone-vs-glasses.md`.
- The floor diagram in the video (three readings within 4 cm, the pad moves once): `Assets/Scripts/FloorcountFloor.ts`, constants `FLOOR_SAMPLES` and `FLOOR_AGREE_CM`.
- Session and MCP call counts: `devpost/BUILD_LOG.md`, regenerated from the session transcripts.
- LEAF results: `devpost/design-pass-report.md`, section "The real floor, 8 November 2026" (the latest sweep; earlier sweeps are in the sections before it).
- Unit tests and planted breaks: `npm test` and `npm run breaks` in `tests/unit/`.
- Beat test figures on the page (130 samples, 140.4 BPM) and 18 of 18 on a fresh clone: `devpost/clean-clone-test.md`.
- The 620 BPM beat-clock fault, the 37 by 32 degree field of view and the 65 degree look-down angle: `devpost/build-report.md`, from the first build session.
- The brief's "40 cm above the far edge, a little below eye level" and CLAD's correction: `devpost/build-report.md`, section "Deviations from the brief".

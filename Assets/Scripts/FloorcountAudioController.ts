/**
 * FloorcountAudioController: plays the practice music and cues from the pad.
 *
 * Owns: the music AudioComponent (one generated loop per tempo), the clave click on counts
 * 1 and 5, the button tap and the step-mastered cue. Also owns the beat clock: the beat is
 * computed from the music's own playback position, so footprint timing always follows the
 * audio the user hears (one count per beat, count 1 at the start of each loop).
 *
 * Expects @inputs: the three tempo loops + three SFX (wired by the bootstrap) and the
 * SceneObjects the sound comes from (the pad speaker, the step card).
 *
 * Must not: decide when tempo changes (FloorcountMain does), or touch visuals.
 */

@component
export class FloorcountAudioController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">FloorcountAudioController: music, clave and cues from the pad</span>')
  @ui.separator
  @ui.group_start("References")
  @input
  @hint("Practice loop at Slow tempo. Its length must be a whole number of 8-counts.")
  musicSlow!: AudioTrackAsset
  @input
  @hint("Practice loop at Medium tempo.")
  musicMedium!: AudioTrackAsset
  @input
  @hint("Practice loop at Full tempo.")
  musicFull!: AudioTrackAsset
  @input
  @hint("Clave click played on counts 1 and 5.")
  claveClick!: AudioTrackAsset
  @input
  @hint("Short tap played when a button or footprint is pinched.")
  uiTap!: AudioTrackAsset
  @input
  @hint("Cue played when a step is mastered.")
  stepMastered!: AudioTrackAsset
  @input
  @hint("Object on the pad the music and clave play from.")
  padSpeaker!: SceneObject
  @input
  @hint("Object the button taps play from (the step card).")
  cardSpeaker!: SceneObject
  @ui.group_end
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Beats per minute of the Slow, Medium and Full loops. Must match the audio files.")
  tempoBpm: number[] = [140, 170, 190]
  @input
  @widget(new SliderWidget(0, 1, 0.05))
  @hint("Music volume.")
  musicVolume: number = 0.7
  @input
  @widget(new SliderWidget(0, 1, 0.05))
  @hint("Clave click volume (counts 1 and 5).")
  claveVolume: number = 0.6
  @input
  @widget(new SliderWidget(0, 1, 0.05))
  @hint("Volume of button taps and the step-mastered cue.")
  cueVolume: number = 0.6
  @input
  @hint("Play the music and clave as spatial sound from the pad.")
  spatialFromPad: boolean = true
  @ui.group_end

  private music!: AudioComponent
  private clave!: AudioComponent
  private tap!: AudioComponent
  private mastered!: AudioComponent

  private tempoLevel = 0
  private playing = false
  private paused = false
  private lastPosition = 0
  /** Completed loops of the current track, so the beat keeps climbing across wraps. */
  private loops = 0
  /** Set by startMusic: the next reading starts a fresh track, so no wrap can be detected. */
  private resync = true
  private fallbackStart = 0
  private fallbackPausedBeats = 0
  private useFallbackClock = false
  private stuckFrames = 0

  onAwake(): void {
    this.music = this.makeSource(this.padSpeaker, "Audio.LowPower")
    this.clave = this.makeSource(this.padSpeaker, "Audio.LowLatency")
    this.tap = this.makeSource(this.cardSpeaker, "Audio.LowLatency")
    this.mastered = this.makeSource(this.padSpeaker, "Audio.LowLatency")
    this.clave.audioTrack = this.claveClick
    this.tap.audioTrack = this.uiTap
    this.mastered.audioTrack = this.stepMastered
    if (this.spatialFromPad) {
      for (const a of [this.music, this.clave]) {
        a.spatialAudio.enabled = true
        a.spatialAudio.distanceEffect.enabled = true
        a.spatialAudio.distanceEffect.minDistance = 150
        a.spatialAudio.distanceEffect.maxDistance = 1500
      }
    }
  }

  private makeSource(host: SceneObject, mode: string): AudioComponent {
    const target = host ? host : this.getSceneObject()
    const a = target.createComponent("Component.AudioComponent") as AudioComponent
    a.playbackMode = mode === "Audio.LowLatency" ? Audio.PlaybackMode.LowLatency : Audio.PlaybackMode.LowPower
    return a
  }

  get bpm(): number {
    return this.tempoBpm[this.tempoLevel]
  }

  get isPlaying(): boolean {
    return this.playing && !this.paused
  }

  get isPaused(): boolean {
    return this.paused
  }

  /** Start the loop for a tempo level from count 1. */
  startMusic(level: number): void {
    this.tempoLevel = Math.max(0, Math.min(2, level))
    const track = [this.musicSlow, this.musicMedium, this.musicFull][this.tempoLevel]
    // isPlaying/isPaused throw while no track has been assigned yet (no audio player).
    if (this.music.audioTrack && (this.music.isPlaying() || this.music.isPaused())) this.music.stop(false)
    this.music.audioTrack = track
    this.music.volume = this.musicVolume
    this.music.play(-1)
    this.playing = true
    this.paused = false
    // Each track gets its own chance to sync to the player: the fallback is for a device with
    // no audio position at all, not for one slow start.
    this.useFallbackClock = false
    this.lastPosition = 0
    this.loops = 0
    this.resync = true
    this.fallbackStart = getTime()
    this.fallbackPausedBeats = 0
    this.stuckFrames = 0
  }

  stopMusic(): void {
    if (this.music.audioTrack && (this.music.isPlaying() || this.music.isPaused())) this.music.stop(true)
    this.playing = false
    this.paused = false
  }

  pause(): void {
    if (!this.playing || this.paused) return
    this.fallbackPausedBeats = this.fallbackBeat()
    this.music.pause()
    this.paused = true
  }

  resume(): void {
    if (!this.playing || !this.paused) return
    this.music.resume()
    this.fallbackStart = getTime() - (this.fallbackPausedBeats * 60) / this.bpm
    this.paused = false
  }

  private fallbackBeat(): number {
    return ((getTime() - this.fallbackStart) * this.bpm) / 60
  }

  /**
   * Beats since the loop started, continuous across loop wraps. Read once per frame.
   *
   * The music's own playback position is the ground truth, so the beat is read straight from
   * it: the footprints then light where the user actually is in the track, even when the
   * preview drops frames. Completed loops are counted so the beat keeps climbing. A wrap is
   * only credited when the position drops back from near the end of the track, which keeps the
   * lagging readings the player gives for the first second after play() from inventing one.
   * Falls back to wall-clock time only if the position never advances (no audio device).
   */
  currentBeat(): number {
    if (!this.playing) return 0
    if (this.useFallbackClock) return this.paused ? this.fallbackPausedBeats : this.fallbackBeat()
    const pos = this.music.position
    const duration = this.music.duration
    if (this.resync) {
      // For the first frames after play() the player can still report the previous track's
      // position. Hold at the start of the loop until it reads like a fresh start, so a tempo
      // change cannot throw the beat (and with it the fade and the review) far ahead.
      if (pos > 1 && getTime() - this.fallbackStart < 1.5) return 0
      this.resync = false
      this.loops = 0
      this.lastPosition = pos
      return (pos * this.bpm) / 60
    }
    if (!this.paused) {
      if (pos <= 0.0001 && getTime() - this.fallbackStart > 0.6) {
        this.stuckFrames++
        if (this.stuckFrames > 30) {
          print("FloorcountAudioController: music position is not advancing, using wall-clock beat timing")
          this.useFallbackClock = true
          return this.fallbackBeat()
        }
      } else {
        this.stuckFrames = 0
      }
      if (duration > 0 && pos + 1 < this.lastPosition && this.lastPosition > duration - 2) this.loops++
      this.lastPosition = pos
    }
    return ((this.loops * duration + this.lastPosition) * this.bpm) / 60
  }

  playClave(): void {
    this.clave.volume = this.claveVolume
    this.clave.play(1)
  }

  playTap(): void {
    this.tap.volume = this.cueVolume
    this.tap.play(1)
  }

  playMastered(): void {
    this.mastered.volume = this.cueVolume
    this.mastered.play(1)
  }
}

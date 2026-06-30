export class MusicLoopSystem {
  constructor(scene, config = {}) {
    this.scene = scene;
    this.tracks = config.tracks ?? {};
    this.volume = config.volume ?? 0.5;
    this.fadeInMs = config.fadeInMs ?? 480;
    this.fadeOutMs = config.fadeOutMs ?? 480;
    this.fadeEase = config.fadeEase ?? "Sine.easeInOut";
    this.currentTrackId = null;
    this.currentSound = null;
  }

  playLoop(trackId, options = {}) {
    const key = this.tracks[trackId] ?? trackId;

    if (!key) {
      return null;
    }

    const volume = options.volume ?? this.volume;
    const fadeInMs = options.fadeInMs ?? this.fadeInMs;
    const fadeOutMs = options.fadeOutMs ?? this.fadeOutMs;

    if (this.currentTrackId === trackId && this.currentSound) {
      this.scene.tweens.killTweensOf(this.currentSound);

      if (!this.currentSound.isPlaying) {
        this.currentSound.setVolume(fadeInMs > 0 ? 0 : volume);
        this.startSoundWhenUnlocked(this.currentSound, () => {
          this.fadeSoundTo(this.currentSound, volume, fadeInMs);
        });
      } else {
        this.currentSound.setVolume(volume);
      }

      return this.currentSound;
    }

    this.stopCurrent(fadeOutMs);

    this.currentTrackId = trackId;
    this.currentSound = this.scene.sound.add(key, {
      loop: true,
      volume: fadeInMs > 0 ? 0 : volume,
    });

    this.startSoundWhenUnlocked(this.currentSound, () => {
      this.fadeSoundTo(this.currentSound, volume, fadeInMs);
    });

    return this.currentSound;
  }

  stop(options = {}) {
    this.stopCurrent(options.fadeOutMs ?? 0);
  }

  destroy() {
    this.stop();
    this.scene = null;
  }

  startSoundWhenUnlocked(sound, onStart = null) {
    const startSound = () => {
      if (!sound.isPlaying) {
        sound.play();
      }

      onStart?.();
    };

    if (!this.scene.sound.locked) {
      startSound();
      return;
    }

    this.scene.sound.once("unlocked", () => {
      if (sound === this.currentSound) {
        startSound();
      }
    });
  }

  fadeSoundTo(sound, volume, duration) {
    if (!duration || duration <= 0) {
      sound.setVolume(volume);
      return;
    }

    this.scene.tweens.killTweensOf(sound);
    this.scene.tweens.add({
      targets: sound,
      volume,
      duration,
      ease: this.fadeEase,
      onComplete: () => sound.setVolume(volume),
    });
  }

  stopCurrent(fadeOutMs) {
    const sound = this.currentSound;

    if (!sound) {
      return;
    }

    this.currentSound = null;
    this.currentTrackId = null;
    this.scene.tweens.killTweensOf(sound);

    if (fadeOutMs > 0 && sound.isPlaying) {
      this.scene.tweens.add({
        targets: sound,
        volume: 0,
        duration: fadeOutMs,
        ease: this.fadeEase,
        onComplete: () => sound.destroy(),
      });
      return;
    }

    sound.destroy();
  }
}

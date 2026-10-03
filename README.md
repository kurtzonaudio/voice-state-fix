# Voice State Fix

Voice State Fix is a Discord voice plugin for a specific, annoying bug: your client says your microphone is live, but Discord's server still thinks you are muted or deafened, so nobody can hear you. The plugin notices the mismatch and pushes your real state to the server.

## What it does

Discord keeps voice state in two places: the server sees what your client last reported, and your client keeps its own media engine state. When those drift apart, for example after a stuck push to talk, a reconnection, or a bad voice state update, the server can keep you muted or deafened while your client shows you talking. Other people see your mic crossed out and hear nothing, until you mute and unmute by hand.

Voice State Fix compares the two states and corrects the server when it is wrong.

## How it works

- Every 15 seconds, and 2.5 seconds after you join a voice channel, the plugin compares the voice state the server has for you (`VoiceStateStore`) with your real media engine state (`MediaEngineStore.isSelfMute` and `isSelfDeaf`).
- If the server says you are muted or deafened and your client says you are not, it sends gateway opcode 4 (`VOICE_STATE_UPDATE`) with your real `self_mute`, `self_deaf`, and `self_video`, plus the channel and guild.
- A 5 second cooldown keeps it from spamming updates if something keeps toggling.
- The check only runs while you are in a voice channel, and it never unmutes you when you really are muted. It only corrects a state that your own client does not agree with.

## Settings

- **Enabled.** Turns the check on and off. Default on.
- **Notify.** Show a toast when a stuck state gets corrected. Default on.

## Installation

Voice State Fix is a user plugin for Vencord or Equicord, and it is built into Kurtcord.

For Vencord or Equicord:

1. Clone the plugin into the userplugins folder:
   ```
   git clone https://github.com/kurtzonaudio/voice-state-fix src/userplugins/VoiceStateFix
   ```
2. Build the client:
   ```
   pnpm build
   ```
3. Restart Discord and enable Voice State Fix in Settings, Plugins.

## Notes and limits

- It corrects the server, so it also fixes how others see you, not just your local UI.
- It cannot help if the mute is real. If you are muted in the client, the plugin leaves it alone.
- The fix is a workaround for a Discord state bug, not a replacement for the normal mute button.

## Kurtzon's Discord plugins

This plugin is part of the Kurtzon's Discord plugins set, which ships with [Kurtcord](https://github.com/kurtzonaudio/kurtcord) and also works in Vencord and Equicord:

- [Stereo Guard](https://github.com/kurtzonaudio/stereo-guard): locally mutes anyone whose audio is not fully mono.
- [Mic Spam Guard](https://github.com/kurtzonaudio/mic-spam-guard): locally mutes anyone who gets too loud or spams their mic.
- [Voice State Fix](https://github.com/kurtzonaudio/voice-state-fix): corrects stuck mute and deafen states on Discord's side.
- [Voice VU Meters](https://github.com/kurtzonaudio/voice-vu-meters): live volume meters next to everyone in a call.
- [Kurtcord Voice Panel](https://github.com/kurtzonaudio/kurtcord-voice-panel): a live Voice & Video panel in the user area.
- [Kurtcord Theme](https://github.com/kurtzonaudio/kurtcord-theme): the Kurtcord wallpaper theme.
- [Camera Unlock](https://github.com/kurtzonaudio/camera-unlock): unlocks the camera and Go Live buttons without the Stream permission.
- [Click To Unmute](https://github.com/kurtzonaudio/click-to-unmute): click a locally muted user's mute icon to unmute them.
- [Auto Cam Off](https://github.com/kurtzonaudio/auto-cam-off): turns your camera off when a staff member joins.

## License

MIT. Copyright (c) 2026 Kurtzon (Kurtzon Audio). See [LICENSE](LICENSE).

Built and maintained by Kurtzon.

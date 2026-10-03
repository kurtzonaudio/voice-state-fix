/*
 * VoiceStateFix, a Vencord/Equicord user plugin
 * Copyright (c) 2026 Kurtzon (Kurtzon Audio)
 * SPDX-License-Identifier: MIT
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, MediaEngineStore, SelectedChannelStore, showToast, Toasts, UserStore, VoiceStateStore } from "@webpack/common";

const logger = new Logger("VoiceStateFix");
const CHECK_MS = 15000;
const JOIN_DELAY_MS = 2500;
const FIX_COOLDOWN_MS = 5000;

const socketModule = findByPropsLazy("getSocket");

const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Push your real mic and deafen state whenever the server has you muted or deafened while you are not.",
        default: true
    },
    notify: {
        type: OptionType.BOOLEAN,
        description: "Show a toast when a stuck voice state gets corrected.",
        default: true
    }
});

let intervalId: ReturnType<typeof setInterval> | undefined;
let joinTimer: ReturnType<typeof setTimeout> | undefined;
let lastFixAt = 0;

function pushRealState(reason: string) {
    const socket = socketModule?.getSocket?.();
    const channelId = SelectedChannelStore.getVoiceChannelId();
    if (!socket || typeof socket.send !== "function" || !channelId) return false;

    const channel = ChannelStore.getChannel(channelId);
    if (!channel) return false;

    const selfMute = !!MediaEngineStore.isSelfMute();
    const selfDeaf = !!MediaEngineStore.isSelfDeaf();
    const selfVideo = !!MediaEngineStore.isVideoEnabled?.();

    try {
        socket.send(4, {
            guild_id: channel.guild_id ?? null,
            channel_id: channelId,
            self_mute: selfMute,
            self_deaf: selfDeaf,
            self_video: selfVideo,
            flags: 0
        });
    } catch (e) {
        logger.error("failed to push the voice state", e);
        return false;
    }

    logger.info(`pushed the real voice state (${reason}): mute=${selfMute} deaf=${selfDeaf}`);
    return true;
}

function check() {
    if (!settings.store.enabled) return;

    const channelId = SelectedChannelStore.getVoiceChannelId();
    if (!channelId) return;

    const me = UserStore.getCurrentUser()?.id;
    if (!me) return;

    const state = VoiceStateStore.getVoiceStateForUser(me);
    if (!state || state.channelId !== channelId) return;

    const realMute = !!MediaEngineStore.isSelfMute();
    const realDeaf = !!MediaEngineStore.isSelfDeaf();

    const stuckMute = state.selfMute === true && !realMute;
    const stuckDeaf = state.selfDeaf === true && !realDeaf;
    if (!stuckMute && !stuckDeaf) return;

    if (Date.now() - lastFixAt < FIX_COOLDOWN_MS) return;
    lastFixAt = Date.now();

    const reason = `${stuckMute ? "stuck mute" : ""}${stuckMute && stuckDeaf ? " and " : ""}${stuckDeaf ? "stuck deafen" : ""}`;
    if (pushRealState(reason) && settings.store.notify) {
        showToast("VoiceStateFix: your mic state was stuck muted on Discord's side, so it got corrected.", Toasts.Type.SUCCESS);
    }
}

export default definePlugin({
    name: "VoiceStateFix",
    description: "Detects when Discord's server still has you muted or deafened while your client is not, and pushes the real state so people can hear you.",
    authors: [{ name: "Kurtzon", id: 0n }],
    tags: ["Voice", "Utility"],
    settings,

    flux: {
        VOICE_CHANNEL_SELECT({ channelId }: { channelId: string | null; }) {
            if (joinTimer !== undefined) clearTimeout(joinTimer);
            if (!channelId) return;
            joinTimer = setTimeout(check, JOIN_DELAY_MS);
        }
    },

    start() {
        intervalId = setInterval(check, CHECK_MS);
    },

    stop() {
        if (intervalId !== undefined) {
            clearInterval(intervalId);
            intervalId = undefined;
        }
        if (joinTimer !== undefined) {
            clearTimeout(joinTimer);
            joinTimer = undefined;
        }
    }
});

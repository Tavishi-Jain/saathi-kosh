"use client";

import { createLocalAudioTrack, Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

type CallStatus = "RINGING" | "ACCEPTED" | "CONNECTED" | "DECLINED" | "ENDED" | "FAILED";
type Call = {
  id: string;
  status: CallStatus;
  callerId: string;
  calleeId: string;
  caller: { id: string; name: string };
  callee: { id: string; name: string };
  createdAt: string;
};

type Member = { id: string; name: string };
type Props = {
  members: Member[];
  actor: string;
  language: "hi" | "en";
  showDirectory: boolean;
  onActorChange: (name: string) => void;
  onCallActivityChange: (active: boolean) => void;
};

const copy = {
  en: {
    directory: "Call a group member",
    hint: "Both people need Saathi Kosh open. Calls use your browser microphone.",
    actingAs: "Calling as",
    identityWarning: "Demo only: the member selector is not sign-in. Anyone with the app link could impersonate a demo member.",
    call: "Call",
    incoming: "Incoming call",
    from: "is calling you",
    accept: "Accept",
    decline: "Decline",
    hangup: "Hang up",
    join: "Join call",
    calling: "Calling",
    ringing: "Ringing",
    connecting: "Connecting…",
    connected: "Connected",
    enableAudio: "Tap to enable call audio.",
    declined: "Call declined",
    ended: "Call ended",
    failed: "Call failed",
    mic: "Allow microphone access in your browser when prompted. Use headphones to reduce echo.",
    micDenied: "Microphone access was denied. Allow it in your browser's site settings, then try again.",
    notConfigured: "LiveKit is not configured. Add the server settings to saathi-kosh/.env and restart.",
    offline: "Could not reach the call service. Check your network and try again.",
    busy: "You or this member already has an active call.",
    noMembers: "No other group members are available.",
    voice: "Voice call",
  },
  hi: {
    directory: "समूह के सदस्य को कॉल करें",
    hint: "दोनों लोगों के Saathi Kosh को खुले रखें। कॉल के लिए ब्राउज़र माइक्रोफ़ोन इस्तेमाल होगा।",
    actingAs: "इस नाम से",
    identityWarning: "केवल डेमो: सदस्य चुनना लॉग-इन नहीं है। ऐप लिंक वाला कोई भी व्यक्ति डेमो सदस्य बनकर कॉल कर सकता है।",
    call: "कॉल करें",
    incoming: "इनकमिंग कॉल",
    from: "आपको कॉल कर रहे हैं",
    accept: "कॉल स्वीकारें",
    decline: "मना करें",
    hangup: "कॉल काटें",
    join: "कॉल से जुड़ें",
    calling: "कॉल की जा रही है",
    ringing: "फ़ोन बज रहा है",
    connecting: "कनेक्ट हो रहा है…",
    connected: "कॉल जुड़ी हुई है",
    enableAudio: "कॉल की आवाज़ चालू करने के लिए यहाँ टैप करें।",
    declined: "कॉल अस्वीकार की गई",
    ended: "कॉल समाप्त हुई",
    failed: "कॉल विफल हुई",
    mic: "माइक्रोफ़ोन की अनुमति पूछने पर ब्राउज़र में अनुमति दें। आवाज़ की गूंज कम करने के लिए हेडफ़ोन लगाएं।",
    micDenied: "माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र की साइट सेटिंग में अनुमति देकर फिर कोशिश करें।",
    notConfigured: "LiveKit सेट नहीं है। saathi-kosh/.env में सर्वर सेटिंग डालकर ऐप रीस्टार्ट करें।",
    offline: "कॉल सेवा तक पहुँचा नहीं जा सका। नेटवर्क जाँचकर फिर कोशिश करें।",
    busy: "आप या यह सदस्य पहले से किसी कॉल में हैं।",
    noMembers: "कॉल के लिए कोई दूसरा सदस्य उपलब्ध नहीं है।",
    voice: "वॉइस कॉल",
  },
} as const;

async function callApi<T>(url: string, actor: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { ...(init?.headers ?? {}), "x-demo-actor": actor },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.warn("[calls] signaling request rejected", { endpoint: url, status: response.status });
    throw new Error(body.error || "Call request failed.");
  }
  return body as T;
}

export function CallCenter({ members, actor, language, showDirectory, onActorChange, onCallActivityChange }: Props) {
  const text = copy[language];
  const [calls, setCalls] = useState<Call[]>([]);
  const [configured, setConfigured] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [joinedCallId, setJoinedCallId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<Awaited<ReturnType<typeof createLocalAudioTrack>> | null>(null);
  const audioElementsRef = useRef<Set<HTMLMediaElement>>(new Set());
  const intentionalDisconnectRef = useRef(false);
  const lastSignalingErrorAtRef = useRef(0);
  const finishCallRef = useRef<(call: Call, action: "hangup" | "failed" | "decline") => Promise<void>>(async () => {});

  const activeCall = calls.find((call) => call.id === activeCallId) ?? null;
  const incomingCall = calls.find((call) => call.status === "RINGING" && call.callee.name === actor) ?? null;
  const activeForActor = calls.find((call) =>
    (call.caller.name === actor || call.callee.name === actor) &&
    ["RINGING", "ACCEPTED", "CONNECTED"].includes(call.status),
  );

  useEffect(() => {
    onCallActivityChange(Boolean(activeForActor));
  }, [activeForActor, onCallActivityChange]);

  const reloadCalls = useCallback(async () => {
    try {
      const result = await callApi<{ calls: Call[]; configured: boolean }>("/api/calls", actor);
      setCalls(result.calls);
      setConfigured(result.configured);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : text.offline);
      if (Date.now() - lastSignalingErrorAtRef.current > 15_000) {
        console.warn("[calls] invitation polling failed", {
          stage: "poll",
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
        lastSignalingErrorAtRef.current = Date.now();
      }
    }
  }, [actor, text.offline]);

  useEffect(() => {
    const initialRequest = window.setTimeout(() => void reloadCalls(), 0);
    const timer = window.setInterval(() => void reloadCalls(), 2000);
    return () => {
      window.clearTimeout(initialRequest);
      window.clearInterval(timer);
    };
  }, [reloadCalls]);

  const endRoom = useCallback(async () => {
    intentionalDisconnectRef.current = true;
    roomRef.current?.removeAllListeners();
    await roomRef.current?.disconnect();
    roomRef.current = null;
    localTrackRef.current?.stop();
    localTrackRef.current = null;
    for (const element of audioElementsRef.current) {
      element.pause();
      element.remove();
    }
    audioElementsRef.current.clear();
    setJoinedCallId(null);
    setAudioNeedsGesture(false);
  }, []);

  useEffect(() => () => {
    void endRoom();
  }, [endRoom]);

  useEffect(() => {
    if (!joinedCallId) return;
    const timer = window.setInterval(() => {
      void callApi(`/api/calls/${joinedCallId}/connected`, actor, { method: "POST" })
        .catch(async (error) => {
          await endRoom();
          try {
            await callApi(`/api/calls/${joinedCallId}`, actor, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "failed" }),
            });
          } catch { /* The displayed local error explains that signaling was lost. */ }
          setActiveCallId(joinedCallId);
          setNotice(error instanceof Error ? error.message : text.offline);
        });
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [actor, endRoom, joinedCallId, text.offline]);

  const joinCall = useCallback(async (call: Call) => {
    if (joinedCallId === call.id || busy) return;
    setBusy(true);
    setNotice("");
    let stage = "requesting room token";
    try {
      const credentials = await callApi<{ token: string; url: string }>(`/api/calls/${call.id}/token`, actor, { method: "POST" });
      const room = new Room({ adaptiveStream: false, dynacast: false });
      intentionalDisconnectRef.current = false;
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio) return;
        const element = track.attach();
        element.autoplay = true;
        element.setAttribute("playsinline", "true");
        document.body.appendChild(element);
        audioElementsRef.current.add(element);
        void element.play().then(async () => {
          setAudioNeedsGesture(false);
          try {
            await callApi(`/api/calls/${call.id}/media-ready`, actor, { method: "POST" });
            await reloadCalls();
          } catch (error) {
            console.error("[calls] remote audio readiness signaling failed", {
              callId: call.id,
              stage: "media-ready signaling",
              errorName: error instanceof Error ? error.name : "UnknownError",
            });
            setNotice(error instanceof Error ? error.message : text.offline);
          }
        }).catch((error: unknown) => {
          console.warn("[calls] remote audio playback blocked", {
            callId: call.id,
            stage: "remote audio playback",
            errorName: error instanceof Error ? error.name : "UnknownError",
          });
          setAudioNeedsGesture(true);
          setNotice(text.enableAudio);
        });
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        for (const element of track.detach()) {
          element.remove();
          audioElementsRef.current.delete(element);
        }
      });
      room.on(RoomEvent.ParticipantDisconnected, () => {
        void finishCallRef.current(call, "hangup");
      });
      room.on(RoomEvent.Disconnected, () => {
        if (!intentionalDisconnectRef.current) void finishCallRef.current(call, "failed");
      });
      roomRef.current = room;
      stage = "connecting to LiveKit room";
      await room.connect(credentials.url, credentials.token);
      stage = "requesting microphone permission";
      const microphone = await createLocalAudioTrack();
      localTrackRef.current = microphone;
      stage = "publishing microphone";
      await room.localParticipant.publishTrack(microphone);
      setJoinedCallId(call.id);
      await callApi(`/api/calls/${call.id}/connected`, actor, { method: "POST" });
      await reloadCalls();
    } catch (error) {
      console.error("[calls] participant join failed", {
        callId: call.id,
        stage,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      await endRoom();
      const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError");
      setNotice(denied ? text.micDenied : error instanceof Error ? error.message : text.offline);
      try {
        await callApi(`/api/calls/${call.id}`, actor, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "failed" }),
        });
        await reloadCalls();
      } catch { /* The local error remains visible if signaling is also offline. */ }
    } finally {
      setBusy(false);
    }
  }, [actor, busy, endRoom, joinedCallId, reloadCalls, text.enableAudio, text.micDenied, text.offline]);

  useEffect(() => {
    const acceptedCall = calls.find((call) =>
      call.status === "ACCEPTED" && call.caller.name === actor && call.id === activeCallId,
    );
    if (!acceptedCall || joinedCallId === acceptedCall.id || busy) return;
    const timer = window.setTimeout(() => void joinCall(acceptedCall), 0);
    return () => window.clearTimeout(timer);
  }, [actor, activeCallId, busy, calls, joinedCallId, joinCall]);

  const enableAudio = async () => {
    const callId = joinedCallId;
    if (!callId || audioElementsRef.current.size === 0) return;
    try {
      await Promise.all([...audioElementsRef.current].map((element) => element.play()));
      setAudioNeedsGesture(false);
      setNotice("");
      await callApi(`/api/calls/${callId}/media-ready`, actor, { method: "POST" });
      await reloadCalls();
    } catch (error) {
      console.error("[calls] audio retry failed", {
        callId,
        stage: "user-gesture audio retry",
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setAudioNeedsGesture(true);
      setNotice(text.enableAudio);
    }
  };

  const finishCall = useCallback(async (call: Call, action: "hangup" | "failed" | "decline") => {
    await endRoom();
    try {
      await callApi(`/api/calls/${call.id}`, actor, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch (error) {
      console.error("[calls] call cleanup signaling failed", {
        callId: call.id,
        stage: action,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setNotice(error instanceof Error ? error.message : text.offline);
    }
    setActiveCallId(call.id);
    await reloadCalls();
  }, [actor, endRoom, reloadCalls, text.offline]);
  useEffect(() => {
    finishCallRef.current = finishCall;
  }, [finishCall]);

  const startCall = async (calleeId: string) => {
    setBusy(true);
    setNotice("");
    try {
      const result = await callApi<{ call: Call }>("/api/calls", actor, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calleeId }),
      });
      setActiveCallId(result.call.id);
      setCalls((previous) => [result.call, ...previous.filter((call) => call.id !== result.call.id)]);
    } catch (error) {
      console.error("[calls] invitation request failed", {
        stage: "create invitation",
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setNotice(error instanceof Error ? error.message : text.offline);
    } finally {
      setBusy(false);
    }
  };

  const answerCall = async (call: Call, action: "accept" | "decline") => {
    setBusy(true);
    setActiveCallId(call.id);
    try {
      await callApi(`/api/calls/${call.id}`, actor, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (action === "decline") {
        await reloadCalls();
        return;
      }
      await reloadCalls();
      await joinCall({ ...call, status: "ACCEPTED" });
    } catch (error) {
      console.error("[calls] invitation response failed", {
        callId: call.id,
        stage: action,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      setNotice(error instanceof Error ? error.message : text.offline);
    } finally {
      setBusy(false);
    }
  };

  const stateLabel = activeCall
    ? activeCall.status === "RINGING" ? (activeCall.caller.name === actor ? text.calling : text.ringing)
      : activeCall.status === "ACCEPTED" ? text.connecting
        : activeCall.status === "CONNECTED" ? text.connected
          : activeCall.status === "DECLINED" ? text.declined
            : activeCall.status === "FAILED" ? text.failed : text.ended
    : "";

  return <>
    {showDirectory && <section className="panel member-calls">
      <div className="table-toolbar"><div><h2>{text.directory}</h2><p>{text.hint}</p></div></div>
      <label className="call-identity"><span>{text.actingAs}</span><select value={actor} disabled={Boolean(activeForActor)} onChange={(event) => onActorChange(event.target.value)}>{members.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}</select></label>
      <p className="call-config-note">{text.identityWarning}</p>
      <p className="call-mic-hint">{text.mic}</p>
      <div className="call-member-list">
        {members.filter((member) => member.name !== actor).map((member) => (
          <div className="call-member" key={member.id}>
            <span className="member-avatar">{member.name.slice(0, 1)}</span>
            <strong>{member.name}</strong>
            <button className="button button-outline" type="button" disabled={!configured || busy || Boolean(activeForActor)} title={!configured ? text.notConfigured : undefined} onClick={() => void startCall(member.id)}>{text.call}</button>
          </div>
        ))}
        {members.length <= 1 && <p>{text.noMembers}</p>}
      </div>
      {!configured && <p className="call-config-note">{text.notConfigured}</p>}
    </section>}

    {incomingCall && !activeCall && <div className="call-scrim" role="presentation">
      <section className="call-dialog" role="dialog" aria-modal="true" aria-labelledby="incoming-call-title">
        <span className="call-avatar">{incomingCall.caller.name.slice(0, 1)}</span>
        <p className="eyebrow">{text.incoming}</p>
        <h2 id="incoming-call-title">{incomingCall.caller.name} {text.from}</h2>
        <p className="call-mic-hint">{text.mic}</p>
        <div className="call-dialog-actions">
          <button className="button button-primary" type="button" disabled={busy} onClick={() => void answerCall(incomingCall, "accept")}>{text.accept}</button>
          <button className="button button-outline" type="button" disabled={busy} onClick={() => void answerCall(incomingCall, "decline")}>{text.decline}</button>
        </div>
      </section>
    </div>}

    {activeCall && <aside className={`call-status-card ${activeCall.status === "CONNECTED" ? "call-connected" : ""}`} aria-live="polite">
      <span className="call-status-dot" />
      <div className="call-status-text">
        <strong>{text.voice} · {stateLabel}</strong>
        <small>{activeCall.caller.name === actor ? activeCall.callee.name : activeCall.caller.name}</small>
      </div>
      {activeCall.status === "ACCEPTED" && joinedCallId !== activeCall.id && activeCall.caller.name === actor &&
        <button className="button button-primary" type="button" disabled={busy} onClick={() => void joinCall(activeCall)}>{text.join}</button>}
      {audioNeedsGesture && joinedCallId === activeCall.id &&
        <button className="button button-primary" type="button" onClick={() => void enableAudio()}>{text.enableAudio}</button>}
      {["RINGING", "ACCEPTED", "CONNECTED"].includes(activeCall.status) &&
        <button className="button button-outline" type="button" disabled={busy} onClick={() => void finishCall(activeCall, "hangup")}>{text.hangup}</button>}
      {["DECLINED", "ENDED", "FAILED"].includes(activeCall.status) &&
        <button className="button button-outline" type="button" onClick={() => setActiveCallId(null)} aria-label={language === "en" ? "Dismiss call status" : "कॉल स्थिति बंद करें"}>×</button>}
    </aside>}
    {notice && <p className="call-notice" role="alert">{notice}</p>}
  </>;
}

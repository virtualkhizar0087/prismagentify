import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../../services/api';

const APP_ID = process.env.REACT_APP_AGORA_APP_ID || '';

export default function AgoraVideo({ streamId, channelName, isHost, userId }) {
  const [joined, setJoined] = useState(false);
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const clientRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    clientRef.current = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
    const client = clientRef.current;

    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers(prev => {
          const existing = prev.find(u => u.uid === user.uid);
          if (existing) return prev.map(u => u.uid === user.uid ? user : u);
          return [...prev, user];
        });
        setTimeout(() => {
          const el = document.getElementById(`remote-video-${user.uid}`);
          if (el) user.videoTrack?.play(el);
        }, 100);
      }
      if (mediaType === 'audio') user.audioTrack?.play();
    });

    client.on('user-unpublished', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    client.on('user-left', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    return () => {
      leaveChannel();
    };
  }, []);

  const getToken = async (role) => {
    try {
      const res = await api.get(`/streams/${streamId}/agora-token`, { params: { uid: userId || 0, role } });
      return res.data.data;
    } catch (err) {
      throw new Error('Failed to get streaming token');
    }
  };

  const joinAsHost = async () => {
    setLoading(true);
    setError('');
    try {
      const client = clientRef.current;
      await client.setClientRole('host');
      const { token, uid } = await getToken('publisher');
      await client.join(APP_ID, channelName, token, uid);

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      await client.publish([audioTrack, videoTrack]);

      if (localVideoRef.current) videoTrack.play(localVideoRef.current);
      setLocalTracks({ audio: audioTrack, video: videoTrack });
      setJoined(true);
    } catch (err) {
      setError(err.message || 'Failed to start stream. Check camera/mic permissions.');
    } finally {
      setLoading(false);
    }
  };

  const joinAsViewer = async () => {
    setLoading(true);
    setError('');
    try {
      const client = clientRef.current;
      await client.setClientRole('audience');
      const { token, uid } = await getToken('subscriber');
      await client.join(APP_ID, channelName, token, uid);
      setJoined(true);
    } catch (err) {
      setError('Failed to connect to stream.');
    } finally {
      setLoading(false);
    }
  };

  const leaveChannel = async () => {
    const client = clientRef.current;
    localTracks.audio?.close();
    localTracks.video?.close();
    await client?.leave?.();
    setJoined(false);
    setLocalTracks({ audio: null, video: null });
    setRemoteUsers([]);
  };

  const toggleMic = async () => {
    if (localTracks.audio) {
      await localTracks.audio.setEnabled(!micOn);
      setMicOn(!micOn);
    }
  };

  const toggleCam = async () => {
    if (localTracks.video) {
      await localTracks.video.setEnabled(!camOn);
      setCamOn(!camOn);
    }
  };

  // HOST VIEW
  if (isHost) {
    return (
      <div style={s.wrap}>
        {!joined ? (
          <div style={s.startWrap}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
            <p style={{ color: '#7BA897', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Camera & microphone will be requested
            </p>
            {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>}
            <button
              onClick={joinAsHost}
              disabled={loading}
              style={s.goLiveBtn}
            >
              {loading ? '⏳ Connecting...' : '🔴 Start Broadcasting'}
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={localVideoRef} style={s.videoEl} />
            <div style={s.liveTag}>🔴 LIVE</div>
            <div style={s.controls}>
              <button onClick={toggleMic} style={{ ...s.ctrlBtn, ...(micOn ? {} : s.ctrlBtnOff) }}>
                {micOn ? '🎤' : '🔇'}
              </button>
              <button onClick={toggleCam} style={{ ...s.ctrlBtn, ...(camOn ? {} : s.ctrlBtnOff) }}>
                {camOn ? '📷' : '🚫'}
              </button>
              <button onClick={leaveChannel} style={{ ...s.ctrlBtn, background: 'rgba(255,68,68,0.3)', borderColor: '#ff6b6b' }}>
                ⏹ End
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VIEWER VIEW
  return (
    <div style={s.wrap}>
      {!joined ? (
        <div style={s.startWrap}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
          <p style={{ color: '#7BA897', marginBottom: '1rem', fontSize: '0.9rem' }}>Stream is live</p>
          {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</p>}
          <button onClick={joinAsViewer} disabled={loading} style={s.goLiveBtn}>
            {loading ? '⏳ Connecting...' : '▶️ Watch Live'}
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {remoteUsers.length === 0 ? (
            <div style={s.startWrap}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#7BA897', fontSize: '0.9rem' }}>Waiting for host to start camera...</p>
            </div>
          ) : (
            remoteUsers.map(u => (
              <div
                key={u.uid}
                id={`remote-video-${u.uid}`}
                style={s.videoEl}
              />
            ))
          )}
          <div style={s.liveTag}>🔴 LIVE</div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { width: '100%', height: '100%', background: '#0D1F19', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  startWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' },
  videoEl: { width: '100%', height: '100%', objectFit: 'cover' },
  liveTag: { position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.8)', borderRadius: '0.3rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#fff' },
  controls: { position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.75rem' },
  ctrlBtn: { background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,194,124,0.4)', color: '#E8F5F0', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem' },
  ctrlBtnOff: { background: 'rgba(255,68,68,0.2)', borderColor: 'rgba(255,68,68,0.5)' },
  goLiveBtn: { background: '#00C27C', border: 'none', color: '#000', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' },
};

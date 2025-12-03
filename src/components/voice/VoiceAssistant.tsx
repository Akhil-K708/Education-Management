import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';

// --- CONFIGURATION ---
const ASSISTANT_NAME = "Nova"; 
const WS_URL = 'ws://192.168.0.224:8080/ws'; 

const VOICE_OPTIONS = [
    { id: 'kathleen', name: 'Kathleen', gender: 'Female' },
    { id: 'amy', name: 'Amy', gender: 'Female' },
    { id: 'kusal', name: 'Kusal', gender: 'Male' },
    { id: 'ryan', name: 'Ryan', gender: 'Male' },
];

const VOICE_SAMPLES: Record<string, any> = {
    kathleen: require('../../../assets/kathleen.mp3'),
    amy: require('../../../assets/amy.mp3'),
    kusal: require('../../../assets/kusal.mp3'),
    ryan: require('../../../assets/ryan.mp3'),
};

const LANGUAGES = [
    { id: 'en-US', label: 'English (US)' },
    { id: 'en-IN', label: 'English (IN)' },
    { id: 'te-IN', label: 'Telugu' },
];

// --- PCM PROCESSOR CODE (Common for Web & Mobile) ---
const PROCESSOR_CODE = `
class PCM16Processor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const inputChannel = input[0];
            const bufferLength = inputChannel.length;
            const outputBuffer = new Int16Array(bufferLength);
            for (let i = 0; i < bufferLength; i++) {
                let sample = inputChannel[i];
                sample = Math.max(-1, Math.min(1, sample));
                outputBuffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            }
            this.port.postMessage(outputBuffer);
        }
        return true;
    }
}
registerProcessor('pcm16-processor', PCM16Processor);
`;

export default function VoiceAssistant() {
  const { state } = useAuth();
  const user = state.user;

  // --- STATE ---
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); 
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  
  // Display Name Logic
  const displayName = (user as any)?.name || user?.username || 'Guest';
  const [statusText, setStatusText] = useState(`Hi ${displayName}, I'm ${ASSISTANT_NAME}!`);
  
  // Transcript State
  const [liveTranscript, setLiveTranscript] = useState('');

  const [selectedLang, setSelectedLang] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('kathleen');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // --- ANIMATIONS ---
  const [showGreeting, setShowGreeting] = useState(false);
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greetingScale = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current; 
  const barAnims = useRef([new Animated.Value(10), new Animated.Value(15), new Animated.Value(25), new Animated.Value(15), new Animated.Value(10)]).current;

  // Refs for Web & Mobile
  const webViewRef = useRef<WebView>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const audioCtxMicRef = useRef<any>(null);
  const workletNodeRef = useRef<any>(null);
  const micStreamRef = useRef<any>(null);
  const audioCtxPlayRef = useRef<any>(null);
  
  // Web Recognition Refs
  const recognitionRef = useRef<any>(null); 
  const wakeWordRef = useRef<any>(null);

  // --- GREETING EFFECT ---
  useEffect(() => {
      const timer = setTimeout(() => {
          setShowGreeting(true);
          Animated.parallel([
              Animated.timing(greetingOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.spring(greetingScale, { toValue: 1, friction: 5, useNativeDriver: true })
          ]).start();
          setTimeout(hideGreeting, 6000);
      }, 1500);
      return () => clearTimeout(timer);
  }, []);

  const hideGreeting = () => {
      Animated.timing(greetingOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setShowGreeting(false);
      });
  };

  useEffect(() => {
      if (Platform.OS !== 'web' && !isVisible) {
          setTimeout(() => {
             webViewRef.current?.postMessage(JSON.stringify({ type: 'START_WAKE_WORD_LISTENER' }));
          }, 2000);
      }
  }, [isVisible]);

  // WEB AUTO WAKE WORD
  useEffect(() => {
      if (Platform.OS === 'web' && !isVisible) {
          if ('webkitSpeechRecognition' in window) {
              const SpeechRecognition = (window as any).webkitSpeechRecognition;
              const wakeRecognizer = new SpeechRecognition();
              wakeRecognizer.continuous = true;
              wakeRecognizer.interimResults = true;
              wakeRecognizer.lang = 'en-US';

              wakeRecognizer.onresult = (event: any) => {
                  for (let i = event.resultIndex; i < event.results.length; ++i) {
                      if (event.results[i].isFinal) {
                          const transcript = event.results[i][0].transcript.trim().toLowerCase();
                          if (transcript.includes('nova') || transcript.includes('hey nova')) {
                              wakeRecognizer.stop();
                              setIsVisible(true);
                              setTimeout(handleConnect, 600);
                          }
                      }
                  }
              };
              
              wakeRecognizer.onend = () => {
                  if (!isVisible && wakeWordRef.current) {
                      try { wakeRecognizer.start(); } catch(e) {}
                  }
              };

              try { wakeRecognizer.start(); } catch(e) {}
              wakeWordRef.current = wakeRecognizer;
          }
      }

      // Cleanup
      if (isVisible && wakeWordRef.current) {
          wakeWordRef.current.stop();
          wakeWordRef.current = null;
      }
      return () => {
          if (wakeWordRef.current) {
              wakeWordRef.current.stop();
              wakeWordRef.current = null;
          }
      };
  }, [isVisible]);

  // --- ANIMATION LOGIC ---
  useEffect(() => {
      if (isVisible) {
          hideGreeting(); 
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 15 }).start();
          setLiveTranscript('');
      } else {
          slideAnim.setValue(300);
      }
  }, [isVisible]);

  useEffect(() => {
      if (isListening || isPlaying) {
          startVisualizer();
          startGlow();
      } else {
          stopVisualizer();
          stopGlow();
      }
  }, [isListening, isPlaying]);

  const startGlow = () => {
      Animated.loop(Animated.sequence([
              Animated.timing(glowAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
              Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true })
      ])).start();
  };
  const stopGlow = () => glowAnim.setValue(1);

  const startVisualizer = () => {
      const animations = barAnims.map(anim => 
          Animated.loop(Animated.sequence([
                  Animated.timing(anim, { toValue: Math.random() * 40 + 10, duration: 200 + Math.random() * 100, useNativeDriver: false }),
                  Animated.timing(anim, { toValue: 10, duration: 200 + Math.random() * 100, useNativeDriver: false })
          ]))
      );
      Animated.parallel(animations).start();
  };
  const stopVisualizer = () => { barAnims.forEach(anim => { anim.stopAnimation(); anim.setValue(10); }); };

  // --- AUDIO SETUP ---
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') alert('Microphone permission is required.');
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false
        });
      }
    })();
    return () => { 
        if (sound) sound.unloadAsync(); 
        if (Platform.OS === 'web') handleWebDisconnect();
    };
  }, [sound]);

  const handlePlaySample = async (voiceId: string) => {
      try {
          if (playingVoiceId === voiceId && sound) {
              await sound.stopAsync(); await sound.unloadAsync();
              setSound(null); setPlayingVoiceId(null);
              return;
          }
          if (sound) { await sound.stopAsync(); await sound.unloadAsync(); }
          
          const source = VOICE_SAMPLES[voiceId];
          if (!source) return;
          
          const { sound: newSound } = await Audio.Sound.createAsync(source);
          setSound(newSound);
          setPlayingVoiceId(voiceId);
          
          newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                  setPlayingVoiceId(null); newSound.unloadAsync(); setSound(null);
              }
          });
          await newSound.playAsync();
      } catch (error) { console.error("Failed to play sample:", error); }
  };
  
  const handleWebConnect = () => {
      if (webSocketRef.current) webSocketRef.current.close();

      setConnectionStatus('CONNECTING');
      setStatusText("Connecting...");
      setLiveTranscript('');

      if(wakeWordRef.current) {
          wakeWordRef.current.stop();
          wakeWordRef.current = null;
      }

      const username = user?.username || 'Guest';
      const url = `${WS_URL}?name=${encodeURIComponent(username)}`;
      
      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer';
      webSocketRef.current = ws;

      ws.onopen = () => {
          setConnectionStatus('CONNECTED');
          setStatusText(`Hi ${displayName}, I'm listening...`);
          
          ws.send(JSON.stringify({
              username: username,
              audio_chunk: "STREAM_STARTING",
              language: selectedLang,
              stream_id: "stream_" + Date.now(),
              session_id: "sess_" + Date.now(),
              audio_option: selectedVoice,
              options: {}
          }));

          handleWebStartMic();
      };

      ws.onclose = () => {
          setConnectionStatus('DISCONNECTED');
          setStatusText("Disconnected");
          setIsListening(false);
          handleWebStopMic();
      };

      ws.onerror = () => {
          setStatusText("Connection Failed");
          setConnectionStatus('DISCONNECTED');
      };

      ws.onmessage = async (evt) => {
          try {
              if (evt.data instanceof ArrayBuffer) return;
              const msg = JSON.parse(evt.data);
              if (msg.audio_bytes) {
                  if (!audioCtxPlayRef.current) audioCtxPlayRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                  if (audioCtxPlayRef.current.state === 'suspended') await audioCtxPlayRef.current.resume();

                  const bin = atob(msg.audio_bytes);
                  const len = bin.length;
                  const bytes = new Uint8Array(len);
                  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
                  const int16 = new Int16Array(bytes.buffer);
                  const float32 = new Float32Array(int16.length);
                  for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

                  playWebAudio(float32, msg.sample_rate || 16000, msg.channels || 1);
              }
          } catch(e) {}
      };
  };

  const playWebAudio = (float32: Float32Array, sampleRate: number, channels: number) => {
      const ctx = audioCtxPlayRef.current;
      setStatusText("Speaking...");
      setLiveTranscript(''); 
      setIsPlaying(true);

      const buffer = ctx.createBuffer(channels, float32.length, sampleRate);
      buffer.copyToChannel(float32, 0);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
          setStatusText("Ready");
          setIsPlaying(false);
      };
      source.start(0);
  };

  const handleWebStartMic = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;

          if ('webkitSpeechRecognition' in window) {
              const SpeechRecognition = (window as any).webkitSpeechRecognition;
              const recognition = new SpeechRecognition();
              recognition.continuous = true;
              recognition.interimResults = true;
              recognition.lang = 'en-US';
              
              recognition.onresult = (event: any) => {
                  let interimTranscript = '';
                  for (let i = event.resultIndex; i < event.results.length; ++i) {
                      interimTranscript += event.results[i][0].transcript;
                  }
                  setLiveTranscript(interimTranscript);
              };
              recognition.start();
              recognitionRef.current = recognition;
          }

          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          audioCtxMicRef.current = audioCtx;
          if (audioCtx.state === 'suspended') await audioCtx.resume();

          const blob = new Blob([PROCESSOR_CODE], {type: 'application/javascript'});
          const url = URL.createObjectURL(blob);
          await audioCtx.audioWorklet.addModule(url);

          const worklet = new AudioWorkletNode(audioCtx, 'pcm16-processor');
          workletNodeRef.current = worklet;

          worklet.port.onmessage = (e) => {
              if (webSocketRef.current?.readyState === WebSocket.OPEN) {
                  webSocketRef.current.send(e.data.buffer);
              }
          };

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(worklet);
          
          setIsListening(true);
          setStatusText("Listening...");
      } catch(e) { console.error(e); }
  };

  const handleWebStopMic = () => {
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t: any) => t.stop());
      if (workletNodeRef.current) workletNodeRef.current.disconnect();
      if (audioCtxMicRef.current) audioCtxMicRef.current.close();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (webSocketRef.current?.readyState === WebSocket.OPEN) webSocketRef.current.send("STOP_AUDIO");

      setIsListening(false);
      setStatusText("Processing...");
  };

  const handleWebDisconnect = () => {
      if (webSocketRef.current) webSocketRef.current.close();
      handleWebStopMic();
      setConnectionStatus('DISCONNECTED');
  };

  // ================= MOBILE HANDLERS =================

  const handleConnect = () => {
    if (Platform.OS === 'web') {
        handleWebConnect();
    } else {
        setConnectionStatus('CONNECTING');
        setStatusText("Connecting...");
        setLiveTranscript('');
        
        webViewRef.current?.postMessage(JSON.stringify({ type: 'STOP_WAKE_WORD_LISTENER' }));
        
        const initData = {
            type: 'INIT_CONFIG',
            payload: { username: user?.username || 'Guest', language: selectedLang, audioOption: selectedVoice, wsUrl: WS_URL }
        };
        webViewRef.current?.postMessage(JSON.stringify(initData));
    }
  };

  const handleDisconnect = () => {
    if (Platform.OS === 'web') {
        handleWebDisconnect();
    } else {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'DISCONNECT' }));
        setConnectionStatus('DISCONNECTED');
        setIsListening(false);
        setIsPlaying(false);
        setLiveTranscript('');
        
        setTimeout(() => {
            webViewRef.current?.postMessage(JSON.stringify({ type: 'START_WAKE_WORD_LISTENER' }));
        }, 1000);
    }
    if (sound) { sound.stopAsync(); setPlayingVoiceId(null); }
  };

  const handleToggleMic = () => {
    if (connectionStatus !== 'CONNECTED') { handleConnect(); return; }
    
    if (Platform.OS === 'web') {
        if (isListening) handleWebStopMic();
        else handleWebStartMic();
    } else {
        if (!isListening) setLiveTranscript('');
        webViewRef.current?.postMessage(JSON.stringify({ type: isListening ? 'STOP_MIC' : 'START_MIC' }));
        setIsListening(!isListening);
    }
  };

  // --- INJECTED JS ---
  const injectedJavaScript = `
    (function() {
        let conn=null,acMic=null,acPlay=null,wn=null,ms=null,q=[],playing=false;
        let recognition = null, liveRecognition = null;
        let isWakeWordRunning = false;
        let isLiveTranscriptRunning = false;
        const pc=\`${PROCESSOR_CODE}\`;

        function send(t,m=''){window.ReactNativeWebView.postMessage(JSON.stringify({type:t,message:m}));}

        // 1. WAKE WORD
        function startWakeWord() {
            if (isWakeWordRunning || isLiveTranscriptRunning || !window.webkitSpeechRecognition) return;
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        let t = event.results[i][0].transcript.trim().toLowerCase();
                        if (t.includes('nova') || t.includes('hey nova')) {
                            send('WAKE_WORD_DETECTED');
                            stopWakeWord();
                        }
                    }
                }
            };
            recognition.onend = () => { if(isWakeWordRunning) try{recognition.start()}catch(e){} };
            try{recognition.start(); isWakeWordRunning = true;}catch(e){}
        }
        function stopWakeWord() { if(recognition) { isWakeWordRunning=false; recognition.stop(); recognition=null; } }

        // 2. LIVE TRANSCRIPT (FIXED)
        function startLiveTranscribe() {
             if (!window.webkitSpeechRecognition) return;
             if(liveRecognition) { try{liveRecognition.stop();}catch(e){} liveRecognition = null; }
             
             liveRecognition = new webkitSpeechRecognition();
             liveRecognition.continuous = true;
             liveRecognition.interimResults = true;
             liveRecognition.lang = 'en-US';
             liveRecognition.onresult = (event) => {
                let txt = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) txt += event.results[i][0].transcript;
                send('LIVE_TRANSCRIPT', txt);
             };
             liveRecognition.onend = () => {
                 if(isLiveTranscriptRunning) { try{liveRecognition.start();}catch(e){} }
             };
             
             try{
                 liveRecognition.start();
                 isLiveTranscriptRunning = true;
             }catch(e){ send('LOG', 'Transcript Start Error: '+e.message); }
        }
        function stopLiveTranscribe() { 
            isLiveTranscriptRunning = false;
            if(liveRecognition) { liveRecognition.stop(); liveRecognition=null; } 
        }

        // 3. CONNECTION
        function conWS(cfg){
            if(conn)conn.close();
            conn=new WebSocket(cfg.wsUrl+'?name='+encodeURIComponent(cfg.username));
            conn.binaryType='arraybuffer';
            conn.onopen=()=>{ 
                send('WS_CONNECTED'); 
                conn.send(JSON.stringify({username:cfg.username,audio_chunk:"STREAM_STARTING",language:cfg.language,audio_option:cfg.audioOption}));
            };
            conn.onclose=()=>send('WS_DISCONNECTED');
            conn.onerror=()=>send('ERROR','WS Error');
            conn.onmessage=(e)=>{
                 try {
                    const m=JSON.parse(e.data);
                    if(m.audio_bytes){
                        if(!acPlay)acPlay=new(window.AudioContext||window.webkitAudioContext)();
                        if(acPlay.state==='suspended')acPlay.resume();
                        const bin=atob(m.audio_bytes);
                        const b=new Uint8Array(bin.length);
                        for(let i=0;i<bin.length;i++)b[i]=bin.charCodeAt(i);
                        const i16=new Int16Array(b.buffer);
                        const f32=new Float32Array(i16.length);
                        for(let i=0;i<i16.length;i++)f32[i]=i16[i]/32768;
                        q.push({b:f32,sr:m.sample_rate||16000,ch:m.channels||1});
                        playQ();
                    }
                }catch(x){}
            };
        }

        function playQ(){
            if(playing||q.length===0)return;
            playing=true; send('PLAYBACK_START');
            const i=q.shift();
            const ab=acPlay.createBuffer(i.ch,i.b.length,i.sr);
            ab.copyToChannel(i.b,0);
            const s=acPlay.createBufferSource();
            s.buffer=ab;
            s.connect(acPlay.destination);
            s.onended=()=>{playing=false; if(q.length===0)send('PLAYBACK_END'); playQ();};
            s.start(0);
        }

        async function startMic(){
            try{
                stopWakeWord();
                startLiveTranscribe();
                
                ms=await navigator.mediaDevices.getUserMedia({audio:true});
                
                acMic=new(window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
                if(acMic.state==='suspended')await acMic.resume();
                const blob = new Blob([pc], {type: 'application/javascript'});
                await acMic.audioWorklet.addModule(URL.createObjectURL(blob));
                wn=new AudioWorkletNode(acMic,'pcm16-processor');
                wn.port.onmessage=(e)=>{if(conn&&conn.readyState===1)conn.send(e.data.buffer);};
                acMic.createMediaStreamSource(ms).connect(wn);
                send('LOG', 'Mic Started');
            }catch(e){send('ERROR', 'Mic Error: '+e.message);}
        }

        function stopMic(){
            stopLiveTranscribe();
            if(ms)ms.getTracks().forEach(t=>t.stop());
            if(wn)wn.disconnect();
            if(acMic)acMic.close();
            if(conn&&conn.readyState===1)conn.send("STOP_AUDIO");
            ms=null; wn=null; acMic=null;
            send('LOG', 'Mic Stopped');
        }

        document.addEventListener('message',function(e){
            const d=JSON.parse(e.data);
            if(d.type==='INIT_CONFIG')conWS(d.payload);
            if(d.type==='START_MIC')startMic();
            if(d.type==='STOP_MIC')stopMic();
            if(d.type==='START_WAKE_WORD_LISTENER')startWakeWord();
            if(d.type==='STOP_WAKE_WORD_LISTENER')stopWakeWord();
            if(d.type==='DISCONNECT'&&conn){conn.send("CLOSE_CONNECTION");conn.close();}
        });
    })();
  `;

  const handleWebViewMessage = (event: any) => {
      try {
          const data = JSON.parse(event.nativeEvent.data);
          switch(data.type) {
              case 'WAKE_WORD_DETECTED':
                  if (!isVisible) {
                      setIsVisible(true);
                      setTimeout(handleConnect, 600); 
                  }
                  break;
              case 'LIVE_TRANSCRIPT':
                  if(data.message) setLiveTranscript(data.message);
                  break;
              case 'WS_CONNECTED':
                  setConnectionStatus('CONNECTED');
                  setStatusText(`Hi ${displayName}, I'm listening...`);
                  if(!isListening) {
                      webViewRef.current?.postMessage(JSON.stringify({ type: 'START_MIC' }));
                      setIsListening(true);
                  }
                  break;
              case 'WS_DISCONNECTED':
                  setConnectionStatus('DISCONNECTED');
                  setStatusText("Disconnected");
                  setIsListening(false);
                  break;
              case 'PLAYBACK_START':
                  setStatusText("Speaking...");
                  setLiveTranscript('');
                  setIsPlaying(true);
                  break;
              case 'PLAYBACK_END':
                  setStatusText("Ready");
                  setIsPlaying(false);
                  break;
          }
      } catch (e) {}
  };

  // --- UI RENDER ---
  const renderSettings = () => (
      <View style={styles.settingsContent}>
          <Text style={styles.settingsTitle}>Customize {ASSISTANT_NAME}</Text>
          <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Voice</Text>
              <View style={styles.grid}>
                  {VOICE_OPTIONS.map((v) => (
                      <TouchableOpacity 
                          key={v.id} 
                          style={[styles.voiceBtn, selectedVoice === v.id && styles.voiceBtnActive]}
                          onPress={() => setSelectedVoice(v.id)}
                      >
                          <View style={styles.voiceInfo}>
                              <View style={[styles.voiceIconBox, selectedVoice === v.id ? {backgroundColor: '#2563EB'} : {backgroundColor: '#E5E7EB'}]}>
                                  <Ionicons name={v.gender === 'Male' ? 'man' : 'woman'} size={18} color={selectedVoice === v.id ? '#FFF' : '#6B7280'} />
                              </View>
                              <Text style={[styles.voiceText, selectedVoice === v.id && styles.voiceTextActive]}>{v.name}</Text>
                          </View>
                          <TouchableOpacity 
                              style={styles.playBtn} 
                              onPress={() => handlePlaySample(v.id)}
                          >
                              <Ionicons name={playingVoiceId === v.id ? "stop-circle" : "play-circle"} size={24} color={playingVoiceId === v.id ? "#EF4444" : "#2563EB"} />
                          </TouchableOpacity>
                      </TouchableOpacity>
                  ))}
              </View>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={() => { setShowSettings(false); handleDisconnect(); setTimeout(handleConnect, 500); }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
      </View>
  );

  return (
    <>
      {Platform.OS !== 'web' && (
            <View style={{ height: 1, width: 1, position: 'absolute', opacity: 0, zIndex: -1 }}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: `<html><body></body></html>`, baseUrl: 'http://localhost/' }}
                injectedJavaScript={injectedJavaScript}
                onMessage={handleWebViewMessage}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                mediaCapturePermissionGrantType="grant"
            />
        </View>
      )}

      {showGreeting && !isVisible && (
          <Animated.View style={[styles.greetingBubble, { opacity: greetingOpacity, transform: [{ scale: greetingScale }] }]}>
              <View style={styles.bubbleContent}>
                  <Text style={styles.greetingText}>👋 Hey! I'm {ASSISTANT_NAME}.</Text>
                  <Text style={styles.greetingSubText}>Say "Hey Nova" to start!</Text>
              </View>
              <View style={styles.arrowContainer}><View style={styles.bubbleArrow} /></View>
          </Animated.View>
      )}

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => { setIsVisible(true); setTimeout(handleConnect, 800); }}
      >
        <Ionicons name="mic" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal transparent visible={isVisible} animationType="none" onRequestClose={() => { handleDisconnect(); setIsVisible(false); }}>
        <View style={styles.backdrop}>
            <TouchableOpacity style={styles.backdropTouch} onPress={() => { handleDisconnect(); setIsVisible(false); }} />
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.sheetHeader}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(!showSettings)}>
                        <Ionicons name={showSettings ? "close-circle" : "settings-sharp"} size={24} color="#6B7280" />
                    </TouchableOpacity>
                    <View style={styles.dragHandle} />
                    <TouchableOpacity style={styles.iconBtn} onPress={() => { handleDisconnect(); setIsVisible(false); }}>
                        <Ionicons name="chevron-down" size={28} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {showSettings ? renderSettings() : (
                    <View style={styles.mainContainer}>
                        <Text style={styles.aiStatus}>{statusText}</Text>
                        
                        {/* Live Transcript Display */}
                        {isListening && (
                            <Text style={styles.transcriptText} numberOfLines={2}>
                                {liveTranscript || "Go ahead, I'm listening..."}
                            </Text>
                        )}
                        
                        <View style={styles.visualizerContainer}>
                            {barAnims.map((anim, i) => (
                                <Animated.View key={i} style={[styles.vizBar, { height: anim, backgroundColor: isListening ? '#22C55E' : (isPlaying ? '#3B82F6' : '#E5E7EB') }]} />
                            ))}
                        </View>
                        
                        <View style={styles.micWrapper}>
                            <Animated.View style={[styles.glowRing, { transform: [{ scale: glowAnim }], opacity: isListening ? 0.4 : 0 }]} />
                            <TouchableOpacity 
                                style={[styles.mainMicBtn, connectionStatus !== 'CONNECTED' && styles.micOffline, isListening && styles.micListening]} 
                                onPress={handleToggleMic}
                            >
                                {connectionStatus === 'CONNECTING' ? <ActivityIndicator color="#FFF" /> : <Ionicons name={isListening ? "stop" : "mic"} size={36} color="#FFF" />}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  greetingBubble: { position: 'absolute', bottom: 100, right: 20, width: 220, backgroundColor: '#1F2937', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, zIndex: 99 },
  bubbleContent: { alignItems: 'flex-start' },
  greetingText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  greetingSubText: { color: '#D1D5DB', fontSize: 12 },
  arrowContainer: { position: 'absolute', bottom: -10, right: 24, alignItems: 'center' },
  bubbleArrow: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1F2937' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 6, zIndex: 100 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  backdropTouch: { flex: 1 },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, minHeight: 450, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  iconBtn: { padding: 8 },
  mainContainer: { alignItems: 'center', marginTop: 10 },
  aiStatus: { fontSize: 22, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
  transcriptText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20, fontStyle: 'italic', minHeight: 40 },
  visualizerContainer: { flexDirection: 'row', alignItems: 'center', height: 60, gap: 8, marginBottom: 40 },
  vizBar: { width: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  micWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 100, height: 100 },
  glowRing: { position: 'absolute', width: '100%', height: '100%', borderRadius: 50, backgroundColor: '#2563EB' },
  mainMicBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  micListening: { backgroundColor: '#EF4444' },
  micOffline: { backgroundColor: '#9CA3AF' },
  settingsContent: { paddingHorizontal: 10 },
  settingsTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 20 },
  settingGroup: { marginBottom: 24 },
  settingLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  voiceBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  voiceBtnActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  voiceInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  voiceIconBox: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  voiceText: { fontWeight: '600', color: '#374151', fontSize: 13, flex: 1 },
  voiceTextActive: { color: '#2563EB' },
  playBtn: { padding: 4 },
  saveBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
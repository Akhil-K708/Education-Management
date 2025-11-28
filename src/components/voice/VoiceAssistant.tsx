import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
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

const WS_URL = 'ws://192.168.0.245:8080/ws'; 

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

export default function VoiceAssistant() {
  const { state } = useAuth();
  const user = state.user;

  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [statusText, setStatusText] = useState('Tap mic to start');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [selectedVoice, setSelectedVoice] = useState('kathleen');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  // --- Help Tooltip State ---
  const [showHelp, setShowHelp] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current; 

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(10))).current;

  // WebView Ref
  const webViewRef = useRef<WebView>(null);

  // --- ANIMATIONS ---
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => { pulseAnim.setValue(1); };

  const startWaveAnimation = () => {
      Animated.loop(
          Animated.stagger(100, waveAnims.map(anim => 
              Animated.sequence([
                  Animated.timing(anim, { toValue: 40, duration: 300, useNativeDriver: false }),
                  Animated.timing(anim, { toValue: 10, duration: 300, useNativeDriver: false })
              ])
          ))
      ).start();
  };

  const stopWaveAnimation = () => { waveAnims.forEach(anim => anim.setValue(10)); };

  // --- PERMISSIONS & HELP POPUP ---
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          alert('Microphone permission is required.');
        }
      }
    })();

    // Show Help Popup Logic
    const showTimer = setTimeout(() => {
        setShowHelp(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        setTimeout(() => {
            Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => setShowHelp(false));
        }, 4000);
    }, 1500);

    return () => clearTimeout(showTimer);
  }, []);

  // --- AUDIO CLEANUP ---
  useEffect(() => {
    return () => {
        if (sound) {
            sound.unloadAsync();
        }
    };
  }, [sound]);

  // --- HANDLE PLAY SAMPLE ---
  const handlePlaySample = async (voiceId: string) => {
      try {
          // If already playing this voice, stop it
          if (playingVoiceId === voiceId && sound) {
              await sound.stopAsync();
              await sound.unloadAsync();
              setSound(null);
              setPlayingVoiceId(null);
              return;
          }

          // Stop previous sound if any
          if (sound) {
              await sound.stopAsync();
              await sound.unloadAsync();
          }

          // Load and play new sound
          const source = VOICE_SAMPLES[voiceId];
          if (!source) {
              console.warn("Audio file not found for", voiceId);
              return;
          }

          const { sound: newSound } = await Audio.Sound.createAsync(source);
          setSound(newSound);
          setPlayingVoiceId(voiceId);

          newSound.setOnPlaybackStatusUpdate((status) => {
              if (status.isLoaded && status.didJustFinish) {
                  setPlayingVoiceId(null);
                  newSound.unloadAsync();
                  setSound(null);
              }
          });

          await newSound.playAsync();

      } catch (error) {
          console.error("Failed to play sample:", error);
      }
  };

  // --- ACTIONS SENT TO WEBVIEW ---
  const handleConnect = () => {
    setConnectionStatus('CONNECTING');
    setStatusText("Connecting...");
    setShowHelp(false);
    
    const initData = {
        type: 'INIT_CONFIG',
        payload: {
            username: user?.username || 'Guest',
            language: selectedLang,
            audioOption: selectedVoice,
            wsUrl: WS_URL
        }
    };
    webViewRef.current?.postMessage(JSON.stringify(initData));
  };

  const handleDisconnect = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'DISCONNECT' }));
    setConnectionStatus('DISCONNECTED');
    setIsListening(false);
    stopPulseAnimation();
    stopWaveAnimation();
    if (sound) { sound.stopAsync(); setPlayingVoiceId(null); }
  };

  const handleToggleMic = () => {
    if (connectionStatus !== 'CONNECTED') {
        handleConnect();
        return;
    }

    if (isListening) {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'STOP_MIC' }));
        setIsListening(false);
        stopPulseAnimation();
        setStatusText("Processing...");
    } else {
        webViewRef.current?.postMessage(JSON.stringify({ type: 'START_MIC' }));
        setIsListening(true);
        startPulseAnimation();
        setStatusText("Listening...");
    }
  };

  // --- MESSAGES FROM WEBVIEW ---
  const handleWebViewMessage = (event: any) => {
      try {
          const data = JSON.parse(event.nativeEvent.data);
          
          switch(data.type) {
              case 'WS_CONNECTED':
                  setConnectionStatus('CONNECTED');
                  setStatusText("Ready");
                  break;
              case 'WS_DISCONNECTED':
                  setConnectionStatus('DISCONNECTED');
                  setStatusText("Disconnected");
                  setIsListening(false);
                  stopPulseAnimation();
                  break;
              case 'PLAYBACK_START':
                  setStatusText("Speaking...");
                  startWaveAnimation();
                  break;
              case 'PLAYBACK_END':
                  setStatusText("Ready");
                  stopWaveAnimation();
                  break;
              case 'LOG':
                  console.log(`[WebView] ${data.message}`);
                  break;
              case 'ERROR':
                  console.error(`[WebView Error] ${data.message}`);
                  if (data.message && data.message.includes("WS")) {
                      setStatusText("Connection Failed");
                      setConnectionStatus('DISCONNECTED');
                  }
                  break;
          }
      } catch (e) {
          console.error("Failed to parse WebView message", e);
      }
  };

  // --- INJECTED JAVASCRIPT ---  Main logic
  const injectedJavaScript = `
    (function() {
        let conn = null;
        let audioCtxMic = null;
        let audioCtxPlay = null;
        let workletNode = null;
        let micStream = null;
        let audioQueue = [];
        let isPlaying = false;
        
        const SAMPLES_PER_SECOND = 16000;
        let pcmBuffer = [];
        let samplesCount = 0;

        const processorCode = \`
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
        \`;

        function sendToRN(type, message = '') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, message }));
        }

        function connectWS(config) {
            try {
                if (conn) conn.close();
                const url = config.wsUrl + '?name=' + encodeURIComponent(config.username);
                sendToRN('LOG', 'Connecting to ' + url);
                conn = new WebSocket(url);
                conn.binaryType = 'arraybuffer';
                conn.onopen = () => {
                    sendToRN('WS_CONNECTED');
                    conn.send(JSON.stringify({
                        username: config.username,
                        audio_chunk: "STREAM_STARTING",
                        language: config.language,
                        stream_id: "stream_" + Date.now(),
                        session_id: "sess_" + Date.now(),
                        audio_option: config.audioOption,
                        options: {}
                    }));
                };
                conn.onclose = (e) => sendToRN('WS_DISCONNECTED', 'Code: ' + e.code);
                conn.onerror = (e) => { sendToRN('ERROR', 'WS Error'); };
                conn.onmessage = handleIncomingAudio;
            } catch (err) {
                sendToRN('ERROR', 'WS Exception: ' + err.message);
            }
        }

        function handleIncomingAudio(evt) {
            try {
                if (evt.data instanceof ArrayBuffer) return;
                const msg = JSON.parse(evt.data);
                if (msg.audio_bytes) {
                    if (!audioCtxPlay) audioCtxPlay = new (window.AudioContext || window.webkitAudioContext)();
                    if (audioCtxPlay.state === 'suspended') audioCtxPlay.resume();
                    const binaryString = atob(msg.audio_bytes);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                    const int16 = new Int16Array(bytes.buffer);
                    const float32 = new Float32Array(int16.length);
                    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
                    audioQueue.push({ buffer: float32, sampleRate: msg.sample_rate || 16000 });
                    processAudioQueue();
                }
            } catch(e) { sendToRN('LOG', 'Msg Parse Error: ' + e.message); }
        }

        function processAudioQueue() {
            if (isPlaying || audioQueue.length === 0) return;
            isPlaying = true;
            sendToRN('PLAYBACK_START');
            const item = audioQueue.shift();
            if (audioCtxPlay.state === 'suspended') audioCtxPlay.resume();
            const audioBuffer = audioCtxPlay.createBuffer(1, item.buffer.length, item.sampleRate);
            audioBuffer.copyToChannel(item.buffer, 0);
            const source = audioCtxPlay.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtxPlay.destination);
            source.onended = () => {
                isPlaying = false;
                if (audioQueue.length === 0) sendToRN('PLAYBACK_END');
                processAudioQueue();
            };
            source.start(0);
        }

        async function startMic() {
            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: {
                    sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true
                }});
                audioCtxMic = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                if (audioCtxMic.state === 'suspended') await audioCtxMic.resume();
                const blob = new Blob([processorCode], {type: 'application/javascript'});
                const url = URL.createObjectURL(blob);
                await audioCtxMic.audioWorklet.addModule(url);
                workletNode = new AudioWorkletNode(audioCtxMic, 'pcm16-processor');
                workletNode.port.onmessage = (e) => {
                    const chunk = e.data;
                    pcmBuffer.push(chunk);
                    samplesCount += chunk.length;
                    if (samplesCount >= SAMPLES_PER_SECOND) {
                        const merged = new Int16Array(samplesCount);
                        let offset = 0;
                        for (const c of pcmBuffer) { merged.set(c, offset); offset += c.length; }
                        if (conn && conn.readyState === WebSocket.OPEN) { conn.send(merged.buffer); }
                        pcmBuffer = []; samplesCount = 0;
                    }
                };
                const source = audioCtxMic.createMediaStreamSource(micStream);
                source.connect(workletNode);
                sendToRN('LOG', 'Mic Started');
            } catch(e) { sendToRN('ERROR', 'Mic Access Failed: ' + e.message); }
        }

        function stopMic() {
            if (micStream) micStream.getTracks().forEach(t => t.stop());
            if (workletNode) workletNode.disconnect();
            if (audioCtxMic) audioCtxMic.close();
            if (conn && conn.readyState === WebSocket.OPEN) { conn.send("STOP_AUDIO"); }
            micStream = null; workletNode = null; audioCtxMic = null; pcmBuffer = []; samplesCount = 0;
            sendToRN('LOG', 'Mic Stopped');
        }

        document.addEventListener('message', function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'INIT_CONFIG') connectWS(data.payload);
            if (data.type === 'START_MIC') startMic();
            if (data.type === 'STOP_MIC') stopMic();
            if (data.type === 'DISCONNECT') { if (conn) { conn.send("CLOSE_CONNECTION"); conn.close(); } }
        });
    })();
  `;

  // --- RENDER UI ---
  const renderSettings = () => (
      <View style={styles.settingsContainer}>
          <Text style={styles.sectionHeader}>Voice Selection</Text>
          <View style={styles.voiceGrid}>
              {VOICE_OPTIONS.map((v) => (
                  <TouchableOpacity 
                      key={v.id} 
                      style={[styles.voiceCard, selectedVoice === v.id && styles.voiceCardActive]}
                      onPress={() => setSelectedVoice(v.id)}
                  >
                      {/* Gender Icon */}
                      <View style={[styles.voiceIcon, selectedVoice === v.id ? {backgroundColor: '#2563EB'} : {backgroundColor: '#E5E7EB'}]}>
                          <Ionicons name={v.gender === 'Male' ? 'man' : 'woman'} size={20} color={selectedVoice === v.id ? '#FFF' : '#6B7280'} />
                      </View>
                      
                      {/* Name */}
                      <Text style={[styles.voiceName, selectedVoice === v.id && styles.voiceNameActive]}>{v.name}</Text>
                      
                      {/* Play Sample Button (Doesn't select, just plays) */}
                      <TouchableOpacity 
                        style={styles.playSampleBtn}
                        onPress={() => handlePlaySample(v.id)}
                      >
                          <Ionicons 
                            name={playingVoiceId === v.id ? "stop-circle" : "play-circle"} 
                            size={24} 
                            color={playingVoiceId === v.id ? "#EF4444" : "#2563EB"} 
                          />
                      </TouchableOpacity>

                      {/* Selection Checkmark */}
                      {selectedVoice === v.id && <View style={styles.checkBadge}><Ionicons name="checkmark" size={10} color="#FFF" /></View>}
                  </TouchableOpacity>
              ))}
          </View>
          <Text style={styles.sectionHeader}>Language</Text>
          <View style={styles.chipContainer}>
              {LANGUAGES.map((l) => (
                  <TouchableOpacity 
                      key={l.id} 
                      style={[styles.langChip, selectedLang === l.id && styles.langChipActive]}
                      onPress={() => setSelectedLang(l.id)}
                  >
                      <Text style={[styles.langText, selectedLang === l.id && styles.langTextActive]}>{l.label}</Text>
                  </TouchableOpacity>
              ))}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={() => {
                setShowSettings(false);
                handleDisconnect();
                setTimeout(() => handleConnect(), 500);
            }}>
            <Text style={styles.saveText}>Save & Reconnect</Text>
          </TouchableOpacity>
      </View>
  );

  const renderMain = () => (
      <View style={styles.mainContent}>
          <View style={[styles.statusBadge, connectionStatus === 'CONNECTED' ? {backgroundColor: '#D1FAE5'} : {backgroundColor: '#FEE2E2'}]}>
              <View style={[styles.statusDot, connectionStatus === 'CONNECTED' ? {backgroundColor: '#059669'} : {backgroundColor: '#DC2626'}]} />
              <Text style={[styles.statusBadgeText, connectionStatus === 'CONNECTED' ? {color: '#059669'} : {color: '#DC2626'}]}>
                  {connectionStatus === 'CONNECTED' ? 'Online' : 'Disconnected'}
              </Text>
          </View>

          <View style={styles.visualizer}>
            {waveAnims.map((anim, i) => (
                <Animated.View key={i} style={[styles.bar, { height: anim, backgroundColor: isListening ? '#F97316' : '#2563EB' }]} />
            ))}
          </View>

          <Text style={styles.status}>{statusText}</Text>

          <TouchableOpacity onPress={handleToggleMic} activeOpacity={0.8}>
            <Animated.View style={[
                styles.micButton, 
                isListening && styles.micActive,
                connectionStatus !== 'CONNECTED' && styles.micDisabled,
                { transform: [{ scale: pulseAnim }] }
            ]}>
                <Ionicons name={isListening ? "stop" : "mic"} size={40} color="#FFF" />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.hint}>{connectionStatus === 'CONNECTED' ? (isListening ? "Tap to Stop" : "Tap to Speak") : "Tap Mic to Connect"}</Text>
      </View>
  );

  return (
    <>
      {showHelp && !isVisible && (
          <Animated.View style={[styles.tooltipContainer, { opacity: fadeAnim }]}>
              <View style={styles.tooltipBubble}>
                  <Text style={styles.tooltipText}>Need any help? Tap me!</Text>
                  <View style={styles.tooltipArrow} />
              </View>
          </Animated.View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => { setIsVisible(true); setTimeout(handleConnect, 1000); }}>
        <Ionicons name="mic" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="slide" onRequestClose={() => { handleDisconnect(); setIsVisible(false); }}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Voice Assistant</Text>
              <View style={{flexDirection:'row', gap: 10}}>
                 {!showSettings && (
                     <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(true)}>
                       <Ionicons name="settings-outline" size={22} color="#374151" />
                     </TouchableOpacity>
                 )}
                 {showSettings && (
                     <TouchableOpacity style={styles.iconBtn} onPress={() => setShowSettings(false)}>
                       <Ionicons name="arrow-back" size={22} color="#374151" />
                     </TouchableOpacity>
                 )}
                 <TouchableOpacity style={styles.iconBtn} onPress={() => { handleDisconnect(); setIsVisible(false); }}>
                   <Ionicons name="close" size={22} color="#374151" />
                 </TouchableOpacity>
              </View>
            </View>
            
            <View style={{ height: 0, width: 0, opacity: 0 }}>
                <WebView
                    ref={webViewRef}
                    originWhitelist={['*']}
                    source={{ html: `<html><body></body></html>`, baseUrl: 'http://localhost/' }}
                    injectedJavaScript={injectedJavaScript}
                    onMessage={handleWebViewMessage}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mediaPlaybackRequiresUserAction={false}
                    allowsInlineMediaPlayback={true}
                    mediaCapturePermissionGrantType="grant" 
                    mixedContentMode="always" 
                    allowFileAccess={true}
                    allowUniversalAccessFromFileURLs={true}
                />
            </View>

            {showSettings ? renderSettings() : renderMain()}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', elevation: 5, zIndex: 999 },
  tooltipContainer: { position: 'absolute', bottom: 90, right: 20, zIndex: 998, alignItems: 'flex-end' },
  tooltipBubble: { backgroundColor: '#1F2937', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, position: 'relative' },
  tooltipText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  tooltipArrow: { position: 'absolute', bottom: -8, right: 20, width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#1F2937' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 450 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  iconBtn: { padding: 4, backgroundColor: '#F3F4F6', borderRadius: 20 },
  mainContent: { alignItems: 'center', marginTop: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: 'bold' },
  visualizer: { flexDirection: 'row', gap: 6, height: 60, alignItems: 'center', marginBottom: 20 },
  bar: { width: 6, borderRadius: 4, backgroundColor: '#E5E7EB' },
  status: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 24 },
  micButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  micActive: { backgroundColor: '#EF4444' },
  micDisabled: { backgroundColor: '#9CA3AF' },
  hint: { marginTop: 16, color: '#9CA3AF', fontSize: 14 },
  settingsContainer: { height: 350 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 10, textTransform: 'uppercase' },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  voiceCard: { width: '48%', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', flexDirection: 'row' },
  voiceCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  voiceIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  voiceName: { fontWeight: '600', color: '#374151', flex: 1, fontSize: 13 },
  voiceNameActive: { color: '#2563EB' },
  checkBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#2563EB', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  playSampleBtn: { padding: 4 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  langChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  langText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  langTextActive: { color: '#FFF' },
  saveBtn: { backgroundColor: '#F97316', padding: 14, borderRadius: 12, marginTop: 24, alignItems: 'center', marginBottom: 20 },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
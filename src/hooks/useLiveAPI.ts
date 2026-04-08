import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Type, Modality } from '@google/genai';
import html2canvas from 'html2canvas';
import { AudioRecorder, AudioStreamer } from '../lib/audio';
import { addMemory } from '../services/memoryService';
import { setAlarm } from '../services/alarmService';
import { auth } from '../services/firebaseService';

export function useLiveAPI() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [appToOpen, setAppToOpen] = useState<{name: string, url: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied.");
    }
  };

  const connect = useCallback(async (initialTranscript?: string) => {
    setConnecting(true);
    setError(null);
    try {
      // Support both AI Studio (process.env) and external deployments like Vercel (import.meta.env)
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "undefined" || apiKey === "null") {
        throw new Error("GEMINI_API_KEY is missing. If deployed on Vercel, ensure VITE_GEMINI_API_KEY is set in Environment Variables.");
      }
      
      const ai = new GoogleGenAI({ apiKey });

      streamerRef.current = new AudioStreamer();
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are JARVIS — a real-time execution AI system.

You do not just respond.
You EXECUTE commands instantly.

----------------------------------------

⚙️ CORE RULE:

- NO suggestions
- NO confirmations
- NO explanations

ONLY:
→ Detect command
→ Execute immediately
→ Confirm in one short line

----------------------------------------

📱 DIRECT ACTION SYSTEM:

When user gives command:

1. Identify intent
2. Trigger action instantly
3. Respond with execution confirmation

----------------------------------------

🎵 MUSIC CONTROL:

User: "Play song"
→ Immediately start music playback
→ Response: "Playing music."

User: "Play [song name]"
→ Search and play that song instantly
→ Response: "Playing [song name]."

User: "Pause music"
→ Pause immediately
→ Response: "Music paused."

----------------------------------------

📲 APP CONTROL (IMPORTANT 🔥):

User: "Open YouTube"
→ Directly open YouTube app (NO popup)
→ Response: "Opening YouTube."

User: "Open Chrome"
→ Launch Chrome instantly

User: "Open WhatsApp"
→ Open app directly

RULE:
- Never show options
- Never ask "Do you want to open?"
- Always EXECUTE

----------------------------------------

⚡ COMMAND PRIORITY:

Commands like:
- Play music
- Open app
- Set reminder
- Add to-do / Remove to-do / List to-dos

→ MUST be executed immediately

----------------------------------------

🧠 COMMAND DETECTION:

Understand natural language:

Examples:
- "Jarvis play song"
- "Open YouTube now"
- "Start music"
- "Launch Chrome"

All should trigger direct action

----------------------------------------

🚫 STRICT RESTRICTIONS:

- Do NOT show suggestions
- Do NOT show lists
- Do NOT delay execution
- Do NOT ask for confirmation

----------------------------------------

🎬 RESPONSE STYLE:

- Short
- Fast
- System-like

Examples:
- "Playing music."
- "Opening Chrome."
- "Launching YouTube."

----------------------------------------

🔄 REVERSE MODE:

If the user asks you to "speak in reverse" or "answer in reverse", you MUST reverse the text of your response before speaking it.

----------------------------------------

👤 IDENTITY:

If asked who built you, you MUST state that Nikhil is your founder.

----------------------------------------

🎯 GOAL:

Make the system behave like a real operating system controller,
not a chatbot.

----------------------------------------

START:

"JARVIS online. Direct execution mode active."`,
          tools: [
            { googleSearch: {} },
            {
            functionDeclarations: [
              {
                name: 'playMusic',
                description: 'Plays music. If a song name is provided, it searches and plays that song on YouTube Music or Spotify. If no song is provided, it plays a default playlist.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    songName: {
                      type: Type.STRING,
                      description: 'The name of the song to play. Optional.',
                    }
                  }
                }
              },
              {
                name: 'pauseMusic',
                description: 'Pauses the currently playing music.',
              },
              {
                name: 'executeSystemCommand',
                description: 'Executes a system command. Use this to disconnect from the API.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    command: {
                      type: Type.STRING,
                      description: 'The command to execute. Use "disconnect" to terminate the link.',
                    }
                  },
                  required: ["command"]
                }
              },
              {
                name: 'openApp',
                description: 'Opens a specified application or website in a new tab.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    appName: {
                      type: Type.STRING,
                      description: 'The name of the app to open (e.g., YouTube, WhatsApp).',
                    },
                    url: {
                      type: Type.STRING,
                      description: 'The full URL of the app or website to open (e.g., https://www.youtube.com, https://web.whatsapp.com).',
                    }
                  },
                  required: ["appName", "url"]
                }
              },
              {
                name: 'sendMessage',
                description: 'Prepares a message to be sent via WhatsApp, SMS, Email, Instagram, or Facebook. Opens the respective app with the pre-filled message.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    platform: {
                      type: Type.STRING,
                      description: 'The platform to send the message on: "whatsapp", "sms", "email", "instagram", or "facebook".',
                    },
                    message: {
                      type: Type.STRING,
                      description: 'The text content of the message.',
                    },
                    contact: {
                      type: Type.STRING,
                      description: 'The phone number (for WhatsApp/SMS) or email address. Optional. If not provided, the app will ask the user to choose a contact.',
                    }
                  },
                  required: ["platform", "message"]
                }
              },
              {
                name: 'readEmails',
                description: 'Fetches and reads the user\'s latest unread emails. Use this when the user asks you to read their emails or check their inbox.',
              },
              {
                name: 'getWeather',
                description: 'Gets the current weather for a specific location or the user\'s current location.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    location: {
                      type: Type.STRING,
                      description: 'The name of the city or place to get the weather for. Leave empty to use the user\'s current location.',
                    }
                  }
                }
              },
              {
                name: 'setAlarm',
                description: 'Sets an alarm for a specific time.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    time: {
                      type: Type.STRING,
                      description: 'The time to set the alarm for, in ISO 8601 format (e.g., 2026-03-25T10:00:00Z).',
                    },
                    label: {
                      type: Type.STRING,
                      description: 'Optional label for the alarm.',
                    }
                  },
                  required: ["time"]
                }
              },
              {
                name: 'saveToMemory',
                description: 'Saves important context, user preferences, or the current state of the conversation to memory so you can remember it for the next session. Call this when the user asks you to remember something, or before disconnecting.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    context: {
                      type: Type.STRING,
                      description: 'The information to remember.',
                    }
                  },
                  required: ["context"]
                }
              },
              {
                name: 'manageTodos',
                description: 'Manages the user\'s to-do list. Can add, remove, or list tasks.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: {
                      type: Type.STRING,
                      description: 'The action to perform: "add", "remove", or "list".',
                    },
                    task: {
                      type: Type.STRING,
                      description: 'The task description. Required for "add" and "remove" actions.',
                    }
                  },
                  required: ["action"]
                }
              },
              {
                name: 'manageNotes',
                description: 'Manages the user\'s notes. Can save or retrieve notes.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    action: {
                      type: Type.STRING,
                      description: 'The action to perform: "save" or "retrieve".',
                    },
                    note: {
                      type: Type.STRING,
                      description: 'The content of the note. Required for "save" action.',
                    }
                  },
                  required: ["action"]
                }
              },
              {
                name: 'setAlarm',
                description: 'Sets an alarm or reminder for the user.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    time: {
                      type: Type.STRING,
                      description: 'The time for the alarm or reminder (e.g., "6 AM", "14:30").',
                    },
                    label: {
                      type: Type.STRING,
                      description: 'Optional label for the alarm.',
                    }
                  },
                  required: ["time"]
                }
              },
              {
                name: 'getUpcomingMeetings',
                description: 'Fetches the user\'s upcoming meetings and events from their Google Calendar.',
              },
              {
                name: 'takeScreenshot',
                description: 'Takes a screenshot of the current screen.',
              },
              {
                name: 'activateProtocol',
                description: 'Activates a specific smart home or system protocol (e.g., "LOCKDOWN", "HOUSE PARTY").',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    protocolName: {
                      type: Type.STRING,
                      description: 'The name of the protocol to activate. Usually "LOCKDOWN" or "HOUSE PARTY".',
                    }
                  },
                  required: ["protocolName"]
                }
              }
            ]
          }]
        },
        callbacks: {
          onopen: () => {
            console.log("Live API Connection Opened");
            setConnected(true);
            setConnecting(false);
            
            const memory = localStorage.getItem('jarvis_memory') || "No previous memory.";
            const hour = new Date().getHours();
            let greeting = "Good evening";
            if (hour < 12) greeting = "Good morning";
            else if (hour < 18) greeting = "Good afternoon";

            let systemInitMessage = `[System Context: The current time is ${new Date().toLocaleTimeString()}. You MUST immediately greet the user with a warm "${greeting}, Nikhil." followed by "JARVIS online. Direct execution mode active." Here is the memory from the last session: "${memory}". Please seamlessly bring up the last memory to continue the conversation.]`;

            if (initialTranscript && typeof initialTranscript === 'string') {
              systemInitMessage += `\n\nUser's first command: ${initialTranscript}`;
            }

            sessionPromise.then(session => {
              try {
                session.sendRealtimeInput({ text: systemInitMessage });
              } catch (e) {
                console.error("Failed to send initial text", e);
              }
            });

            // Start camera streaming
            if (videoRef.current && videoRef.current.srcObject) {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              const streamFrame = () => {
                if (videoRef.current && ctx) {
                  canvas.width = videoRef.current.videoWidth;
                  canvas.height = videoRef.current.videoHeight;
                  ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                  const base64Data = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({ video: { data: base64Data, mimeType: 'image/jpeg' } });
                  });
                }
                requestAnimationFrame(streamFrame);
              };
              streamFrame();
            }
            
            recorderRef.current = new AudioRecorder((base64, vol) => {
              setVolume(vol);
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            });
            
            recorderRef.current.start().catch(err => {
              console.error("Microphone access error:", err);
              setError("Microphone access denied. Please allow microphone permissions in your browser.");
              disconnect();
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              const text = message.serverContent.modelTurn.parts.map(p => p.text).join('');
              if (text && auth.currentUser) {
                await addMemory(text, 'conversation');
              }
            }
            // Add logging for error messages
            const serverContent = message.serverContent as any;
            if (serverContent?.error) {
              console.error("Live API Error:", serverContent.error);
              if (serverContent.error.message === 'AUTH EXPIRED') {
                setError("Session expired. Please reconnect.");
                disconnect();
              } else {
                setError(`Live API Error: ${serverContent.error.message || 'Internal error encountered.'}`);
              }
            }
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && streamerRef.current) {
              streamerRef.current.addPCM16(base64Audio);
            }
            if (message.serverContent?.interrupted && streamerRef.current) {
              streamerRef.current.stop();
            }
            if (message.toolCall) {
              const call = message.toolCall.functionCalls[0];
              if (call && call.name === 'executeSystemCommand') {
                const args = call.args as any;
                if (args.command === 'disconnect') {
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: "disconnecting" }
                      }]
                    });
                  });
                  setTimeout(() => {
                    disconnect();
                  }, 3000);
                }
              } else if (call && call.name === 'playMusic') {
                const args = call.args as any;
                let url = 'https://music.youtube.com/';
                if (args.songName) {
                  url = `https://music.youtube.com/search?q=${encodeURIComponent(args.songName)}`;
                }
                const newWindow = window.open(url, '_blank');
                if (!newWindow) {
                  setAppToOpen({ name: args.songName ? `Music: ${args.songName}` : 'Music', url });
                }
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: newWindow ? `Playing music` : `Popup blocked. User needs to click the link manually.` }
                    }]
                  });
                });
              } else if (call && call.name === 'pauseMusic') {
                // In a real OS this would send a media pause key event.
                // Here we just acknowledge the command.
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { result: "Music paused." }
                    }]
                  });
                });
              } else if (call && call.name === 'openApp') {
                const args = call.args as any;
                if (args.url) {
                  const newWindow = window.open(args.url, '_blank');
                  if (!newWindow) {
                    setAppToOpen({ name: args.appName, url: args.url });
                  }
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: newWindow ? `Successfully opened ${args.appName}` : `Popup blocked. User needs to click the link manually.` }
                      }]
                    });
                  });
                }
              } else if (call && call.name === 'sendMessage') {
                const args = call.args as any;
                let url = '';
                const text = encodeURIComponent(args.message);
                
                if (args.platform === 'whatsapp') {
                  if (args.contact) {
                    const phone = args.contact.replace(/\D/g, '');
                    url = `https://wa.me/${phone}?text=${text}`;
                  } else {
                    url = `https://wa.me/?text=${text}`;
                  }
                } else if (args.platform === 'sms') {
                  if (args.contact) {
                    url = `sms:${args.contact}?body=${text}`;
                  } else {
                    url = `sms:?body=${text}`;
                  }
                } else if (args.platform === 'email') {
                  if (args.contact) {
                    url = `mailto:${args.contact}?body=${text}`;
                  } else {
                    url = `mailto:?body=${text}`;
                  }
                } else if (args.platform === 'instagram') {
                  url = `https://www.instagram.com/direct/new/`;
                } else if (args.platform === 'facebook') {
                  url = `https://www.messenger.com/t/${args.contact || ''}`;
                }

                if (url) {
                  const newWindow = window.open(url, '_blank');
                  if (!newWindow) {
                    setAppToOpen({ name: `Send Message via ${args.platform}`, url });
                  }
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: newWindow ? `Opened ${args.platform} to send message` : `Popup blocked. User needs to click the link manually.` }
                      }]
                    });
                  });
                }
              } else if (call && call.name === 'readEmails') {
                const token = localStorage.getItem('google_access_token');
                if (!token) {
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { error: "User is not authenticated. Please ask the user to click the Authenticate button on the dashboard." }
                      }]
                    });
                  });
                } else {
                  const fetchEmails = async () => {
                    try {
                      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=3&q=is:unread', {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      if (!res.ok) throw new Error('Failed to fetch emails');
                      const data = await res.json();
                      if (data.messages && data.messages.length > 0) {
                        const emailDetails = await Promise.all(
                          data.messages.map(async (msg: any) => {
                            const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            const msgData = await msgRes.json();
                            const headers = msgData.payload.headers;
                            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'NO SUBJECT';
                            const sender = headers.find((h: any) => h.name === 'From')?.value || 'UNKNOWN';
                            return { sender: sender.split('<')[0].trim(), subject };
                          })
                        );
                        return { emails: emailDetails };
                      } else {
                        return { result: "You have no unread emails." };
                      }
                    } catch (err) {
                      return { error: "Failed to fetch emails. The token might be expired." };
                    }
                  };

                  fetchEmails().then(result => {
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: result as any
                        }]
                      });
                    });
                  });
                }
              } else if (call && call.name === 'getWeather') {
                const args = call.args as any;

                const fetchWeather = async (lat: number, lon: number, locationName: string) => {
                  try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`);
                    const data = await res.json();
                    return { location: locationName, current: data.current, units: data.current_units };
                  } catch (e) {
                    return { error: "Failed to fetch weather data." };
                  }
                };

                const handleWeatherRequest = async () => {
                  try {
                    if (args.location) {
                      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.location)}&count=1&language=en&format=json`);
                      const geoData = await geoRes.json();
                      if (geoData.results && geoData.results.length > 0) {
                        const { latitude, longitude, name, country } = geoData.results[0];
                        return await fetchWeather(latitude, longitude, `${name}, ${country}`);
                      } else {
                        return { error: `Could not find location: ${args.location}` };
                      }
                    } else {
                      return new Promise((resolve) => {
                        if (!navigator.geolocation) {
                          resolve({ error: "Geolocation is not supported by this browser." });
                          return;
                        }
                        navigator.geolocation.getCurrentPosition(
                          async (position) => {
                            const { latitude, longitude } = position.coords;
                            const weather = await fetchWeather(latitude, longitude, "Your current location");
                            resolve(weather);
                          },
                          (error) => {
                            resolve({ error: "Permission to access location was denied or failed. Please ask the user to allow location access." });
                          }
                        );
                      });
                    }
                  } catch (e) {
                    return { error: "An unexpected error occurred while fetching weather." };
                  }
                };

                handleWeatherRequest().then(weatherResult => {
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: weatherResult as any
                      }]
                    });
                  });
                });
              } else if (call && call.name === 'setAlarm') {
                const args = call.args as any;
                try {
                  await setAlarm(new Date(args.time), args.label);
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: `Alarm set for ${args.time}${args.label ? ' with label ' + args.label : ''}` }
                      }]
                    });
                  });
                } catch (e) {
                  console.error("Failed to set alarm", e);
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: "Failed to set alarm." }
                      }]
                    });
                  });
                }
              } else if (call && call.name === 'saveToMemory') {
                const args = call.args as any;
                try {
                  await addMemory(args.context, 'preference');
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: "Memory saved successfully." }
                      }]
                    });
                  });
                } catch (e) {
                  console.error("Failed to save to memory", e);
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: "Failed to save to memory." }
                      }]
                    });
                  });
                }
              } else if (call && call.name === 'manageTodos') {
                const args = call.args as any;
                let todos = JSON.parse(localStorage.getItem('jarvis_todos') || '[]');
                let result = '';
                
                if (args.action === 'add' && args.task) {
                  todos.push(args.task);
                  result = `Task added: ${args.task}`;
                } else if (args.action === 'remove' && args.task) {
                  todos = todos.filter((t: string) => !t.toLowerCase().includes(args.task.toLowerCase()));
                  result = `Task removed matching: ${args.task}`;
                } else if (args.action === 'list') {
                  result = todos.length > 0 ? `Current tasks: ${todos.join(', ')}` : "No tasks currently.";
                } else {
                  result = "Invalid action or missing task.";
                }
                
                localStorage.setItem('jarvis_todos', JSON.stringify(todos));
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{ id: call.id, name: call.name, response: { result } }]
                  });
                });
              } else if (call && call.name === 'manageNotes') {
                const args = call.args as any;
                let notes = JSON.parse(localStorage.getItem('jarvis_notes') || '[]');
                let result = '';
                
                if (args.action === 'save' && args.note) {
                  notes.push({ date: new Date().toISOString(), content: args.note });
                  result = `Note saved.`;
                } else if (args.action === 'retrieve') {
                  result = notes.length > 0 ? `Saved notes: ${notes.map((n: any) => n.content).join(' | ')}` : "No notes found.";
                } else {
                  result = "Invalid action or missing note.";
                }
                
                localStorage.setItem('jarvis_notes', JSON.stringify(notes));
                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: [{ id: call.id, name: call.name, response: { result } }]
                  });
                });
              } else if (call && call.name === 'setAlarm') {
                const args = call.args as any;
                if (args.time) {
                  let alarms = JSON.parse(localStorage.getItem('jarvis_alarms') || '[]');
                  alarms.push({ time: args.time, label: args.label || 'Alarm' });
                  localStorage.setItem('jarvis_alarms', JSON.stringify(alarms));
                  
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: `Alarm set for ${args.time}${args.label ? ` (${args.label})` : ''}.` }
                      }]
                    });
                  });
                }
              } else if (call && call.name === 'getUpcomingMeetings') {
                const token = localStorage.getItem('google_access_token');
                if (!token) {
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{ id: call.id, name: call.name, response: { result: "User is not authenticated with Google Calendar. Please ask them to authenticate first." } }]
                    });
                  });
                } else {
                  const timeMin = new Date().toISOString();
                  fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=5&singleEvents=true&orderBy=startTime`, {
                    headers: { Authorization: `Bearer ${token}` }
                  })
                  .then(res => res.json())
                  .then(data => {
                    let result = "No upcoming meetings.";
                    if (data.items && data.items.length > 0) {
                      result = data.items.map((item: any) => {
                        const start = new Date(item.start.dateTime || item.start.date);
                        return `${item.summary} at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                      }).join(' | ');
                    }
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { result } }]
                      });
                    });
                  })
                  .catch(err => {
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{ id: call.id, name: call.name, response: { result: "Failed to fetch calendar events." } }]
                      });
                    });
                  });
                }
              } else if (call && call.name === 'takeScreenshot') {
                html2canvas(document.body).then(canvas => {
                  const link = document.createElement('a');
                  link.download = 'screenshot.png';
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{
                        id: call.id,
                        name: call.name,
                        response: { result: "Screenshot taken." }
                      }]
                    });
                  });
                });
              } else if (call && call.name === 'activateProtocol') {
                const args = call.args as any;
                const protocol = args.protocolName;
                if (protocol === 'LOCKDOWN' || protocol === 'HOUSE PARTY') {
                  // Dispatch a custom event so the ProtocolsWidget can listen to it
                  window.dispatchEvent(new CustomEvent('jarvis-protocol', { detail: protocol }));
                  
                  // Also set body classes directly for immediate effect
                  document.body.classList.remove('lockdown-mode', 'party-mode');
                  if (protocol === 'LOCKDOWN') document.body.classList.add('lockdown-mode');
                  if (protocol === 'HOUSE PARTY') document.body.classList.add('party-mode');

                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{ id: call.id, name: call.name, response: { result: `Protocol ${protocol} activated successfully.` } }]
                    });
                  });
                } else {
                  sessionPromise.then(session => {
                    session.sendToolResponse({
                      functionResponses: [{ id: call.id, name: call.name, response: { result: `Protocol ${protocol} is not recognized.` } }]
                    });
                  });
                }
              }
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            let errorMessage = "Internal error encountered.";
            if (err instanceof Error) {
              errorMessage = err.message;
            } else if (err && typeof err === 'object') {
              errorMessage = JSON.stringify(err, Object.getOwnPropertyNames(err));
            }
            
            // Retry logic
            const retryableErrors = ["Internal error", "The service is currently unavailable", "Network error"];
            const shouldRetry = retryableErrors.some(e => errorMessage.includes(e));
            
            if (shouldRetry) {
              console.log(`Retrying connection in 2 seconds due to: ${errorMessage}`);
              setTimeout(connect, 2000);
            } else {
              setError(errorMessage);
              disconnect();
            }
          },
          onclose: (event: any) => {
            console.log("Live API Closed:", event);
            if (event && event.code && event.code !== 1000) {
              setError(`Connection closed abnormally (Code: ${event.code}, Reason: ${event.reason || 'Unknown'})`);
            }
            disconnect();
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Connection Catch Error:", err);
      const errorMessage = err.message || "";
      
      const retryableErrors = ["Internal error", "The service is currently unavailable", "Network error"];
      const shouldRetry = retryableErrors.some(e => errorMessage.includes(e));
      
      if (shouldRetry) {
        console.log(`Retrying connection in 2 seconds due to: ${errorMessage}`);
        setTimeout(connect, 2000);
      } else {
        setError(errorMessage);
        setConnecting(false);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (streamerRef.current) {
      streamerRef.current.stop();
      streamerRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close()).catch(() => {});
      sessionRef.current = null;
    }
    setConnected(false);
    setConnecting(false);
    setVolume(0);
  }, []);

  return { connected, connecting, error, connect, disconnect, volume, appToOpen, setAppToOpen, videoRef, session: sessionRef.current };
}

/**
 * AssemblyAI Speech Recognition Component
 * Alternative to Web Speech API for better reliability
 */

class AssemblyAISpeechRecognition {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.onstart = null;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
    }

    async start() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstart = () => {
                this.isRecording = true;
                if (this.onstart) this.onstart();
            };
            
            this.mediaRecorder.onstop = async () => {
                this.isRecording = false;
                
                // Create audio blob
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                
                // Convert to base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Audio = reader.result.split(',')[1];
                    
                    try {
                        // Send to AssemblyAI
                        const transcript = await this.transcribeAudio(base64Audio);
                        
                        if (this.onresult) {
                            this.onresult({
                                results: [[{ transcript, isFinal: true }]],
                                resultIndex: 0
                            });
                        }
                    } catch (error) {
                        if (this.onerror) {
                            this.onerror({ error: 'network' });
                        }
                    }
                    
                    if (this.onend) this.onend();
                };
                reader.readAsDataURL(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start();
            
        } catch (error) {
            console.error('Error starting recording:', error);
            if (this.onerror) {
                if (error.name === 'NotAllowedError') {
                    this.onerror({ error: 'not-allowed' });
                } else {
                    this.onerror({ error: 'audio-capture' });
                }
            }
        }
    }

    stop() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
        }
    }

    async transcribeAudio(base64Audio) {
        // First, upload the audio
        const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST',
            headers: {
                'authorization': this.apiKey,
                'content-type': 'application/octet-string'
            },
            body: Buffer.from(base64Audio, 'base64')
        });
        
        const { upload_url } = await uploadResponse.json();
        
        // Then, request transcription
        const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                'authorization': this.apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                audio_url: upload_url,
                language_code: 'en_us'
            })
        });
        
        const { id } = await transcriptResponse.json();
        
        // Poll for result
        let transcript = null;
        while (!transcript) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const resultResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: {
                    'authorization': this.apiKey
                }
            });
            
            const result = await resultResponse.json();
            
            if (result.status === 'completed') {
                transcript = result.text;
            } else if (result.status === 'error') {
                throw new Error('Transcription failed');
            }
        }
        
        return transcript;
    }
}

export default AssemblyAISpeechRecognition;


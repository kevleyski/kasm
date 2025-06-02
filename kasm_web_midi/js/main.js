import init, { ChordProcessor } from '../pkg/kasm_web_midi.js';

class MIDIChordApp {
    constructor() {
        this.midiAccess = null;
        this.chordProcessor = null;
        this.selectedInput = null;
        this.selectedOutput = null;
        this.chordSettings = Array(9).fill().map((_, i) => ({
            noteOffset: [0, 4, 7, 12, 16, 19, 24, 28, 31][i],
            velocityPercent: [100, 80, 80, 60, 60, 60, 40, 40, 40][i],
            probabilityPercent: [100, 90, 90, 70, 70, 70, 50, 50, 50][i]
        }));
    }
    
    async init() {
        try {
            await init();
            this.chordProcessor = new ChordProcessor();
            this.log('WebAssembly module loaded successfully', 'note-out');
            this.createControls();
            this.updateChordProcessor();
        } catch (error) {
            this.log(`Failed to load WebAssembly: ${error}`, 'error');
        }
    }
    
    async enableMIDI() {
        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.log('MIDI access granted', 'note-out');
            this.updateMIDIStatus();
            this.populateMIDISelects();
            this.setupMIDIListeners();
        } catch (error) {
            this.log(`MIDI access denied: ${error}`, 'error');
            document.getElementById('midi-status').textContent = 'MIDI not supported or access denied';
        }
    }
    
    updateMIDIStatus() {
        const status = document.getElementById('midi-status');
        if (this.midiAccess) {
            const inputs = Array.from(this.midiAccess.inputs.values());
            const outputs = Array.from(this.midiAccess.outputs.values());
            status.textContent = `Connected - ${inputs.length} inputs, ${outputs.length} outputs available`;
        } else {
            status.textContent = 'Not connected';
        }
    }
    
    populateMIDISelects() {
        const inputSelect = document.getElementById('midi-input-select');
        const outputSelect = document.getElementById('midi-output-select');
        
        inputSelect.innerHTML = '<option value="">Select input...</option>';
        outputSelect.innerHTML = '<option value="">Select output...</option>';
        
        for (let input of this.midiAccess.inputs.values()) {
            const option = document.createElement('option');
            option.value = input.id;
            option.textContent = input.name;
            inputSelect.appendChild(option);
        }
        
        for (let output of this.midiAccess.outputs.values()) {
            const option = document.createElement('option');
            option.value = output.id;
            option.textContent = output.name;
            outputSelect.appendChild(option);
        }
        
        inputSelect.addEventListener('change', (e) => {
            if (this.selectedInput) {
                this.selectedInput.onmidimessage = null;
            }
            this.selectedInput = this.midiAccess.inputs.get(e.target.value);
            if (this.selectedInput) {
                this.selectedInput.onmidimessage = (msg) => this.handleMIDIMessage(msg);
                this.log(`Input connected: ${this.selectedInput.name}`, 'note-out');
            }
        });
        
        outputSelect.addEventListener('change', (e) => {
            this.selectedOutput = this.midiAccess.outputs.get(e.target.value);
            if (this.selectedOutput) {
                this.log(`Output connected: ${this.selectedOutput.name}`, 'note-out');
            }
        });
    }
    
    setupMIDIListeners() {
        this.midiAccess.addEventListener('statechange', () => {
            this.updateMIDIStatus();
            this.populateMIDISelects();
        });
    }
    
    handleMIDIMessage(message) {
        const [status, note, velocity] = message.data;
        const messageType = status & 0xF0;
        const channel = status & 0x0F;
        
        if (messageType === 0x90 && velocity > 0) {
            this.log(`Note ON: ${note} vel:${velocity} ch:${channel}`, 'note-in');
            this.processNoteOn(note, velocity);
        } else if (messageType === 0x80 || (messageType === 0x90 && velocity === 0)) {
            this.log(`Note OFF: ${note} ch:${channel}`, 'note-in');
            this.processNoteOff(note);
        }
    }
    
    processNoteOn(note, velocity) {
        if (!this.chordProcessor || !this.selectedOutput) return;
        
        const outputNotes = this.chordProcessor.process_note_on(note, velocity);
        
        for (let i = 0; i < outputNotes.length; i++) {
            const noteData = outputNotes[i];
            const outNote = noteData[0];
            const outVelocity = noteData[1];
            
            const midiMessage = [0x90, outNote, outVelocity];
            this.selectedOutput.send(midiMessage);
            this.log(`Chord Note ON: ${outNote} vel:${outVelocity}`, 'note-out');
        }
    }
    
    processNoteOff(note) {
        if (!this.chordProcessor || !this.selectedOutput) return;
        
        const outputNotes = this.chordProcessor.process_note_off(note);
        
        for (let i = 0; i < outputNotes.length; i++) {
            const noteData = outputNotes[i];
            const outNote = noteData[0];
            
            const midiMessage = [0x80, outNote, 0];
            this.selectedOutput.send(midiMessage);
            this.log(`Chord Note OFF: ${outNote}`, 'note-out');
        }
    }
    
    createControls() {
        const grid = document.getElementById('controls-grid');
        grid.innerHTML = '';
        
        this.chordSettings.forEach((setting, index) => {
            const control = document.createElement('div');
            control.className = 'chord-control';
            control.innerHTML = `
                <h3>Note ${index + 1}</h3>
                <div>
                    <label class="dial-label">Note Offset</label>
                    <input type="number" class="note-offset-input" value="${setting.noteOffset}" 
                           min="-24" max="24" data-index="${index}">
                </div>
                <div class="dial-container">
                    <label class="dial-label">Velocity %</label>
                    <div class="dial" data-type="velocity" data-index="${index}">
                        <div class="dial-pointer"></div>
                    </div>
                    <div class="dial-value">${setting.velocityPercent}%</div>
                </div>
                <div class="dial-container">
                    <label class="dial-label">Probability %</label>
                    <div class="dial" data-type="probability" data-index="${index}">
                        <div class="dial-pointer"></div>
                    </div>
                    <div class="dial-value">${setting.probabilityPercent}%</div>
                </div>
            `;
            grid.appendChild(control);
        });
        
        this.setupControlListeners();
        this.updateDialPositions();
    }
    
    setupControlListeners() {
        document.querySelectorAll('.note-offset-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.chordSettings[index].noteOffset = parseInt(e.target.value);
                this.updateChordProcessor();
            });
        });
        
        document.querySelectorAll('.dial').forEach(dial => {
            this.setupDialInteraction(dial);
        });
    }
    
    setupDialInteraction(dial) {
        let isDragging = false;
        
        const updateValue = (e) => {
            const rect = dial.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
            const degrees = (angle * 180 / Math.PI + 90 + 360) % 360;
            const value = Math.round((degrees / 360) * 100);
            
            const index = parseInt(dial.dataset.index);
            const type = dial.dataset.type;
            
            this.chordSettings[index][type + 'Percent'] = value;
            this.updateDialPosition(dial, value);
            this.updateDialValue(dial, value);
            this.updateChordProcessor();
        };
        
        dial.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateValue(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging && e.target.closest('.dial') === dial) {
                updateValue(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }
    
    updateDialPositions() {
        document.querySelectorAll('.dial').forEach(dial => {
            const index = parseInt(dial.dataset.index);
            const type = dial.dataset.type;
            const value = this.chordSettings[index][type + 'Percent'];
            this.updateDialPosition(dial, value);
        });
    }
    
    updateDialPosition(dial, value) {
        const pointer = dial.querySelector('.dial-pointer');
        const degrees = (value / 100) * 360;
        pointer.style.transform = `translateX(-50%) rotate(${degrees}deg)`;
    }
    
    updateDialValue(dial, value) {
        const valueDisplay = dial.parentElement.querySelector('.dial-value');
        valueDisplay.textContent = `${value}%`;
    }
    
    updateChordProcessor() {
        if (!this.chordProcessor) return;
        
        this.chordSettings.forEach((setting, index) => {
            this.chordProcessor.set_chord_note(
                index,
                setting.noteOffset,
                setting.velocityPercent,
                setting.probabilityPercent
            );
        });
    }
    
    log(message, className = '') {
        const log = document.getElementById('activity-log');
        const timestamp = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = className;
        entry.textContent = `[${timestamp}] ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
        
        while (log.children.length > 100) {
            log.removeChild(log.firstChild);
        }
    }
}

const app = new MIDIChordApp();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
    
    document.getElementById('enable-midi').addEventListener('click', () => {
        app.enableMIDI();
    });
});

window.app = app;
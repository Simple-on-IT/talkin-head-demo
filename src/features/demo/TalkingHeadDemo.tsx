import { Loader2, Play, Square } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Field } from '../../shared/ui/Field';
import { StatusLine } from '../../shared/ui/StatusLine';
import { useTalkingHeadDemo } from './useTalkingHeadDemo';

export function TalkingHeadDemo(): JSX.Element {
  const demo = useTalkingHeadDemo();

  const playIcon = demo.isBusy ? <Loader2 className="spin" size={18} /> : <Play size={18} />;

  return (
    <main className="app-shell">
      <section className="stage" aria-label="Talking avatar stage">
        <div className="avatar-wrap" ref={demo.handleAvatarMount} />
      </section>

      <section className="control-panel" aria-label="Speech controls">
        <Field className="text-field" label="Text" labelFor="speech-text">
          <textarea
            id="speech-text"
            value={demo.text}
            rows={4}
            onChange={demo.handleTextChange}
          />
        </Field>

        <div className="control-row">
          <Field label="Voice" labelFor="voice">
            <select id="voice" value={demo.voice} onChange={demo.handleVoiceChange}>
              {demo.voices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field className="speed-field" label={`Speed ${demo.speed.toFixed(2)}x`} labelFor="speed">
            <input
              id="speed"
              type="range"
              min="0.75"
              max="1.35"
              step="0.05"
              value={demo.speed}
              onChange={demo.handleSpeedChange}
            />
          </Field>

          <div className="button-row">
            <Button
              disabled={demo.isBusy}
              icon={playIcon}
              label="Play"
              variant="primary"
              onClick={demo.handlePlayClick}
            />

            <Button
              icon={<Square size={18} />}
              label="Stop"
              variant="secondary"
              onClick={demo.handleStopClick}
            />
          </div>
        </div>

        <StatusLine status={demo.status} text={demo.statusText} />
      </section>
    </main>
  );
}

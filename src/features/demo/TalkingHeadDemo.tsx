import { ArrowLeft, Clapperboard, Loader2, Play, Settings2, Square } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { Field } from '../../shared/ui/Field';
import { StatusLine } from '../../shared/ui/StatusLine';
import { demoCopy } from './demoCopy';
import { useTalkingHeadDemo } from './useTalkingHeadDemo';

export function TalkingHeadDemo(): JSX.Element {
  const demo = useTalkingHeadDemo();

  const primaryIcon = demo.isBusy ? (
    <Loader2 className="spin" size={20} />
  ) : demo.isSpeaking ? (
    <Square size={20} />
  ) : (
    <Play size={20} />
  );
  const primaryLabel = demo.isSpeaking ? demoCopy.actions.stop : demoCopy.actions.play;
  const shellClassName = [
    'app-shell',
    demo.isCinematicMode ? 'cinematic-shell' : '',
    demo.isSpeaking ? 'cinematic-speaking' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={shellClassName}>
      <section className="stage" aria-label={demoCopy.labels.scene}>
        <div className="avatar-wrap" ref={demo.handleAvatarMount} />
      </section>

      <section className="cinematic-overlay" aria-label={demoCopy.labels.cinematicScene}>
        <div className="cinematic-tech-layer" aria-hidden="true">
          <span className="tech-corner tech-corner-top-left" />
          <span className="tech-corner tech-corner-top-right" />
          <span className="tech-corner tech-corner-bottom-left" />
          <span className="tech-corner tech-corner-bottom-right" />
          <span className="tech-line tech-line-top" />
          <span className="tech-line tech-line-right" />
          <span className="tech-node tech-node-one" />
          <span className="tech-node tech-node-two" />
          <span className="tech-node tech-node-three" />
          <span className="tech-node tech-node-four" />
        </div>

        {demo.isCinematicMode && (
          <button
            className="cinematic-corner-control cinematic-back-control"
            type="button"
            aria-label={demoCopy.labels.back}
            onClick={demo.handleBackClick}
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <button
          className="cinematic-corner-control"
          type="button"
          aria-label={primaryLabel}
          disabled={demo.isBusy}
          onClick={demo.handlePrimaryActionClick}
        >
          {primaryIcon}
        </button>
      </section>

      <section
        className={demo.isCinematicMode ? 'control-panel cinematic-hidden-panel' : 'control-panel'}
        aria-label={demoCopy.labels.speechControls}
      >
        <button
          className="advanced-toggle"
          type="button"
          aria-expanded={demo.isAdvancedOpen}
          aria-label={demoCopy.actions.settings}
          onClick={demo.handleAdvancedToggle}
        >
          <Settings2 size={18} />
        </button>

        <Field
          className="text-field show-text-field"
          label={demoCopy.labels.text}
          labelFor="speech-text"
        >
          <textarea
            id="speech-text"
            value={demo.text}
            rows={4}
            onChange={demo.handleTextChange}
          />
        </Field>

        <div className="primary-action-row">
          <Button
            className="show-primary-button"
            disabled={demo.isBusy}
            icon={primaryIcon}
            label={primaryLabel}
            variant="primary"
            onClick={demo.handlePrimaryActionClick}
          />
          <Button
            className="cinematic-mode-button"
            icon={<Clapperboard size={18} />}
            label={demoCopy.actions.cinematic}
            variant="secondary"
            onClick={demo.handleCinematicModeClick}
          />
        </div>

        <div className={demo.isAdvancedOpen ? 'control-row advanced-open' : 'control-row'}>
          <Field label={demoCopy.labels.voice} labelFor="voice">
            <select id="voice" value={demo.voice} onChange={demo.handleVoiceChange}>
              {demo.voices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="button-row">
            <Button
              icon={<Square size={18} />}
              label={demoCopy.actions.stop}
              variant="secondary"
              onClick={demo.handleStopClick}
            />
          </div>
        </div>

        {(demo.isAdvancedOpen || demo.status === 'error') && (
          <StatusLine status={demo.status} text={demo.statusText} />
        )}
      </section>
    </main>
  );
}

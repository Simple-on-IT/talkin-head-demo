import { HeadTtsEndpointAdapter } from './headTtsEndpointAdapter';

export class BrowserHeadTtsAdapter extends HeadTtsEndpointAdapter {
  constructor() {
    super(['webgpu', 'wasm'], 'Loading HeadTTS model...');
  }
}

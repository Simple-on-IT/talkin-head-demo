import { HeadTtsEndpointAdapter } from './headTtsEndpointAdapter';

const localHeadTtsEndpoint = 'http://127.0.0.1:8882/v1';

export class LocalHeadTtsAdapter extends HeadTtsEndpointAdapter {
  constructor() {
    super([localHeadTtsEndpoint], 'Connecting to local HeadTTS...');
  }
}

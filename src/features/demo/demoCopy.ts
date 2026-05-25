export const demoCopy = {
  actions: {
    cinematic: 'Cinematic',
    play: 'Говорить',
    settings: 'Настройки',
    stop: 'Стоп'
  },
  labels: {
    back: 'Назад',
    cinematicScene: 'Кинематографичная демо-сцена',
    scene: 'Сцена с говорящим аватаром',
    speechControls: 'Управление речью',
    text: 'Текст',
    voice: 'Голос'
  },
  status: {
    avatarReady: 'Аватар готов',
    emptyText: 'Введите русский текст',
    idle: 'Готово',
    loadAvatar: 'Загружаем аватар...',
    loadAvatarFailed: 'Не удалось загрузить аватар',
    loadTts: 'Подключаем Silero TTS...',
    speak: 'Говорит',
    synthesize: 'Готовим голос...',
    synthesizeFailed: 'Не удалось синтезировать речь',
    stopped: 'Остановлено',
    avatarNotReady: 'Аватар еще загружается'
  }
} as const;

# TalkingHead Russian Speech Demo

Небольшая демка для видео про TalkingHead: в браузере открывается 3D-аватар, пользователь вводит русский текст, локальный Silero TTS генерирует речь, а TalkingHead проигрывает аудио и двигает губами по эвристической русской viseme-разметке.

Проект сделан как понятный локальный пример, а не как production-сервис. Главная цель: показать связку `React + TalkingHead + локальный Russian TTS backend` и оставить код достаточно простым, чтобы его можно было разобрать после ролика.

## Что внутри

- Vite + React + TypeScript frontend.
- TalkingHead avatar scene в браузере.
- Локальный Python backend с Silero Russian TTS.
- Простая русская grapheme/phone-to-viseme разметка для движения губ.
- Обычный режим UI и отдельный cinematic mode для вертикальной записи.

## Требования

- Node.js 18+ и npm.
- Python 3.10+.
- Chromium/Chrome/Edge для просмотра демо.
- Интернет при первом запуске: скачиваются npm-пакеты, Silero model checkpoint и remote TalkingHead avatar assets.

На macOS при ошибках установки нативных Python-пакетов может понадобиться:

```bash
xcode-select --install
```

На Debian/Ubuntu при похожих ошибках:

```bash
sudo apt install build-essential python3-dev
```

## Первый запуск

Установить frontend-зависимости:

```bash
npm install
```

Установить Python-зависимости для Silero:

```bash
npm run setup:python
```

Python-пакеты устанавливаются из `requirements.txt`, чтобы новые версии `torch`/`numpy` не меняли окружение неожиданно.

Команда выбора Python кроссплатформенная:

- Windows: `py -3`, затем `python`, затем `python3`.
- macOS/Linux: `python3`, затем `python`.
- Для virtualenv или конкретного интерпретатора можно задать `PYTHON`.

Пример:

```bash
PYTHON=/path/to/python npm run setup:python
```

## Запуск демо

Обычный старт одной командой:

```bash
npm start
```

Она запускает два процесса:

- `npm run dev:ru-tts` на `http://127.0.0.1:8892/v1`
- `npm run dev` на `http://127.0.0.1:5173/`

Когда Vite напишет локальный адрес, открыть:

```text
http://127.0.0.1:5173/
```

Остановить оба процесса можно через `Ctrl+C` в этом же терминале.

Frontend по умолчанию ходит в `http://127.0.0.1:8892/v1`. Если backend запущен на другом адресе:

```bash
VITE_TTS_ENDPOINT=http://127.0.0.1:9000/v1 npm run dev
```

## Ручной запуск

Если удобнее держать backend и frontend в разных терминалах:

Terminal 1:

```bash
npm run dev:ru-tts
```

Terminal 2:

```bash
npm run dev
```

Открыть:

```text
http://127.0.0.1:5173/
```

## Режим для записи

Для avatar-focused вертикального кадра:

```text
http://127.0.0.1:5173/?mode=cinematic
```

Для возврата к обычному UI:

```text
http://127.0.0.1:5173/
```

## Проверка перед публикацией

```bash
npm run build
```

Сборка выполняет TypeScript check и `vite build`.

Полная локальная проверка:

```bash
npm run check
```

Она запускает focused tests для русской viseme-разметки и production build.

Для ручной проверки демо:

1. Запустить `npm start`.
2. Дождаться сообщения `Silero Russian TTS is ready`.
3. Открыть `http://127.0.0.1:5173/`.
4. Нажать `Говорить` с текстом по умолчанию.
5. Проверить обычный режим и `?mode=cinematic`.

## Troubleshooting

Если Silero падает с ошибкой поврежденного checkpoint вроде:

```text
PytorchStreamReader failed reading zip archive: failed finding central directory
```

удалить частично скачанную модель и запустить backend снова.

Backend также проверяет SHA256 модели после скачивания. Если upstream-файл изменился, запуск остановится с ошибкой checksum mismatch; в этом случае нужно осознанно обновить `MODEL_SHA256` в `scripts/start-silero-tts-server.py`.

Windows PowerShell:

```powershell
Remove-Item .silero\v5_ru.pt
npm run dev:ru-tts
```

macOS/Linux:

```bash
rm .silero/v5_ru.pt
npm run dev:ru-tts
```

Если отсутствует Python-модуль:

```bash
npm run setup:python
```

Если `npm run setup:python` сообщает, что Python 3 не найден:

```bash
python3 --version
```

На Windows также:

```powershell
py -3 --version
```

Если `npm install` сообщает `EBUSY` для `node_modules/esbuild`, закрыть dev-серверы или остановить Node-процессы, затем повторить установку.

## Ограничения

- Русская синхронизация губ эвристическая, это не forced alignment.
- На длинных или эмоциональных фразах тайминги могут расходиться с реальным аудио.
- Демо рассчитано на локальный запуск: TTS backend не деплоится вместе со статической Vite-сборкой.
- Используемые avatar assets загружаются из официального репозитория TalkingHead при запуске, URL зафиксирован на tag `v1.7.0`.

## Лицензия и внешние assets

- Код этого репозитория распространяется под MIT License, см. `LICENSE`.
- `@met4citizen/talkinghead` устанавливается как npm dependency и распространяется на условиях своего пакета.
- Silero model checkpoint скачивается при первом запуске в `.silero/v5_ru.pt` и проверяется по SHA256; перед публикацией производного продукта отдельно проверьте условия использования Silero models.
- Avatar `.glb` загружается из официального репозитория TalkingHead examples. По README upstream-проекта пример `brunette.glb` создан в Ready Player Me и доступен для некоммерческого использования на условиях CC BY-NC 4.0; для коммерческого продукта замените аватар на ассет с подходящей лицензией.

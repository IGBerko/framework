# Framework 1.0

Лёгкий JavaScript-фреймворк: реактивные данные, шаблоны в HTML, плагины, каталог библиотек и отладчик **Yozilla**. Без сборки и npm.

## Подключение

```html
<!DOCTYPE html>
<html>
<head>
  <title>Мой первый Framework проект</title>
  <script src="https://cdn.jsdelivr.net/gh/IGBerko/framework@main/%40framework1.0/frm.js"></script>
</head>
<body>
  <frameplugins src="framecloud/1.0/math"></frameplugins>
</body>
</html>
```

Если на странице нет разметки (только скрипт и `<frameplugins>`), по центру сверху появится окно **«Спасибо что используете Framework!»** с краткой инструкцией.

> Важно: в `src` нужен протокол `https://`, иначе браузер ищет файл относительно вашего сайта. Тег `<frameplugins>` надо закрывать полностью и закрывать кавычку в `src="..."`.

## Реактивное приложение

```html
<div id="app">
  <input f-model="name">
  <h2>Привет, {{ name }}!</h2>
  <button @click="count++">Кликов: {{ count }}</button>
</div>
<script>
  Framework.app('#app', { state: { name: '', count: 0 }, methods: {} });
</script>
```

Директивы: `f-text`, `f-html`, `f-show`, `f-model`, `@событие` (или `f-on:событие`), `f-bind:атрибут`, `f-ignore`.
Низкоуровневое: `Framework.reactive(obj)`, `Framework.effect(fn)`, `Framework.on/emit`, `Framework.h`, `Framework.$`, `Framework.$$`.

## Модули

Короткий адрес раскрывается в полный путь:

| Короткий | Полный |
|---|---|
| `framecloud/1.0/math` | `cdn.jsdelivr.net/gh/IGBerko/framework@main/@framework1.0/plugins/math.framejs` |
| `framecloud/lib/lodash` | сторонняя библиотека из каталога (CDN) |

В `src` можно перечислить несколько модулей через запятую. Подключаются по порядку.

Сообщения в консоли:

- успех: `Успешно подключен модуль <название>`
- ошибка: `Модуль <название> не смог подключиться из-за ошибки: <текст>` (плюс красное окно Yozilla)

### Плагины из коробки

- `math` — `Framework.math.sum / avg / median / clamp / lerp / round / percent / randInt`
- `storage` — `Framework.storage.set / get / remove / clear` (JSON и ttl)
- `http` — `Framework.http.get / post / put / delete` (JSON, таймаут)

### Каталог библиотек

`lodash`, `dayjs`, `axios`, `chartjs`, `marked`, `anime`, `confetti`.
После подключения доступны как глобальный объект и как `Framework.libs.<имя>`.
Свою библиотеку добавляют в объект `LIBS` в `frm.js` или подключают по прямому URL: `<frameplugins src="https://cdn.example/lib.js">`.

### Свой плагин

Файл `plugins/<имя>.framejs`:

```js
Framework.plugin('hello', {
  version: '1.0.0',
  requires: ['framecloud/lib/lodash'],   // необязательно
  install(fw) {
    fw.hello = name => `Привет, ${fw.libs.lodash.capitalize(name)}!`;
  }
});
```

Имя в `Framework.plugin` должно совпадать с именем файла. Если `install` бросит ошибку, Yozilla покажет её и сообщит, что модуль не подключился.

## Yozilla

- Консоль: цветные сообщения с меткой `Yozilla`.
- Сайт: красное окно при любой ошибке (в том числе `window.onerror`, необработанные промисы, ошибки в выражениях шаблона и сбои модулей); кнопка «🦖 Yozilla» слева внизу открывает журнал.
- Обновления: при запуске читает `framework.json` на GitHub. Если версия новее, пишет в консоль и показывает окно со ссылкой и списком изменений (changelog).

Формат `framework.json` (см. файл в репозитории): `latest`, `url` и `changelog` по версиям с полями `added`, `changed`, `fixed`.
Адрес манифеста задаётся в `FrameworkConfig.manifest`.

## Настройка

```html
<script>
  window.FrameworkConfig = {
    cloud: 'https://cdn.jsdelivr.net/gh/IGBerko/framework@main/',  // корень облака плагинов
    manifest: 'https://raw.githubusercontent.com/IGBerko/framework/main/framework.json',
    checkUpdates: true,
    welcome: true
  };
</script>
<script src="https://cdn.jsdelivr.net/gh/IGBerko/framework@main/%40framework1.0/frm.js"></script>
```

## Структура для публикации

```
@framework1.0/frm.js
@framework1.0/plugins/math.framejs
@framework1.0/plugins/storage.framejs
@framework1.0/plugins/http.framejs
framework.json          ← кладёте в GitHub-репозиторий
```

На сервере с плагинами включите CORS (`Access-Control-Allow-Origin: *`) для `.js` и `.framejs`.

# Плагины и библиотеки Framework

Модуль в Framework — это либо **плагин** (файл `.framejs` из этого репозитория), либо **библиотека** (сторонняя, из встроенного каталога), либо любой **скрипт по прямой ссылке**.

## Подключение

```html
<script src="https://cdn.jsdelivr.net/gh/IGBerko/framework@main/%40framework1.0/frm.js"></script>

<frameplugins src="framecloud/1.0/math"></frameplugins>
```

Несколько модулей можно перечислить через запятую или перенос строки:

```html
<frameplugins src="framecloud/1.0/math, framecloud/1.0/storage, framecloud/lib/lodash"></frameplugins>
```

Модули подключаются **по порядку**. Дождаться окончания загрузки можно так:

```js
Framework.on('ready', () => {
  // все <frameplugins> обработаны, плагины доступны
});
```

### Что пишет Yozilla

| Ситуация | Консоль | На сайте |
|---|---|---|
| Модуль подключен | `Успешно подключен модуль <название>` | запись в журнале (кнопка 🦖 слева внизу) |
| Модуль не подключился | `Модуль <название> не смог подключиться из-за ошибки: <причина>` | красное окно Yozilla |

Типичные причины ошибок: файла нет в репозитории (HTTP 404), в коде плагина синтаксическая ошибка, плагин не вызвал `Framework.plugin("имя", …)`, имя в вызове не совпало с именем файла, библиотеки нет в каталоге, не подключилась зависимость.

## Короткие адреса

| Вы пишете | Framework загружает |
|---|---|
| `framecloud/1.0/math` | `https://cdn.jsdelivr.net/gh/IGBerko/framework@main/@framework1.0/plugins/math.framejs` |
| `framecloud/lib/lodash` | библиотека `lodash` из каталога (CDN) |
| `https://site.ru/my.framejs` | плагин по прямой ссылке |
| `https://site.ru/lib.js` | обычный скрипт по прямой ссылке |

Число в `framecloud/1.0/…` — версия серии Framework. Плагины для серии 1.0 лежат в `@framework1.0/plugins/`.

## Плагины из репозитория

### `math` — математика

`framecloud/1.0/math` → `Framework.math`

| Функция | Что делает | Пример |
|---|---|---|
| `sum(...числа)` | сумма | `math.sum(1, 2, 3)` → `6` |
| `avg(...числа)` | среднее | `math.avg(2, 4)` → `3` |
| `median(...числа)` | медиана | `math.median(1, 9, 5)` → `5` |
| `min`, `max` | минимум и максимум | `math.max(3, 8)` → `8` |
| `clamp(v, lo, hi)` | ограничить диапазоном | `math.clamp(15, 0, 10)` → `10` |
| `lerp(a, b, t)` | интерполяция | `math.lerp(0, 100, 0.25)` → `25` |
| `round(v, знаков)` | округление | `math.round(3.14159, 2)` → `3.14` |
| `percent(часть, всего, знаков)` | процент | `math.percent(1, 4)` → `25` |
| `randInt(lo, hi)` | случайное целое | `math.randInt(1, 6)` |

Числа можно передавать и массивом: `math.sum([1, 2, 3])`.

### `storage` — localStorage с JSON и временем жизни

`framecloud/1.0/storage` → `Framework.storage`

```js
Framework.storage.set('user', { name: 'Аня' });        // навсегда
Framework.storage.set('token', 'abc', 3600);          // на час (секунды)
Framework.storage.get('user');                         // { name: 'Аня' }
Framework.storage.get('missing', 'по умолчанию');      // 'по умолчанию'
Framework.storage.remove('token');
Framework.storage.clear();                             // только ключи Framework (префикс frm:)
```

### `http` — запросы

`framecloud/1.0/http` → `Framework.http`

```js
const data = await Framework.http.get('https://api.example.com/items');
await Framework.http.post('https://api.example.com/items', { title: 'Новый' });
await Framework.http.put(url, body);
await Framework.http.delete(url);
// третий параметр: { timeout: 5000, headers: { Authorization: '...' } }
```

JSON разбирается автоматически. Статус не 2xx и превышение времени ожидания (по умолчанию 15 с) выбрасывают ошибку, которую покажет Yozilla, если её не перехватить через `try/catch`.

## Библиотеки (каталог `framecloud/lib/…`)

| Подключение | Библиотека | Доступна как |
|---|---|---|
| `framecloud/lib/lodash` | [Lodash](https://lodash.com) 4 | `_`, `Framework.libs.lodash` |
| `framecloud/lib/dayjs` | [Day.js](https://day.js.org) 1 | `dayjs`, `Framework.libs.dayjs` |
| `framecloud/lib/axios` | [Axios](https://axios-http.com) 1 | `axios`, `Framework.libs.axios` |
| `framecloud/lib/chartjs` | [Chart.js](https://www.chartjs.org) 4 | `Chart`, `Framework.libs.chartjs` |
| `framecloud/lib/marked` | [Marked](https://marked.js.org) | `marked`, `Framework.libs.marked` |
| `framecloud/lib/anime` | [anime.js](https://animejs.com) 3 | `anime`, `Framework.libs.anime` |
| `framecloud/lib/confetti` | [canvas-confetti](https://github.com/catdad/canvas-confetti) 1 | `confetti`, `Framework.libs.confetti` |

Пример:

```html
<frameplugins src="framecloud/lib/dayjs, framecloud/lib/confetti"></frameplugins>
<script>
  Framework.on('ready', () => {
    console.log(dayjs().format('DD.MM.YYYY'));
    confetti();
  });
</script>
```

Библиотеки берутся с jsDelivr (`cdn.jsdelivr.net/npm/…`). Если глобальный объект уже есть на странице, повторно файл не загружается.

### Добавить свою библиотеку в каталог

В `frm.js` в объект `LIBS`:

```js
const LIBS = {
  // …
  dompurify: { url: 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js', global: 'DOMPurify' }
};
```

Поле `global` — имя объекта, который библиотека кладёт в `window`. Если после загрузки его нет, Yozilla сообщит об ошибке. Без правки каталога любую библиотеку можно подключить по прямой ссылке: `<frameplugins src="https://…/lib.min.js">`.

## Как написать свой плагин

1. Создайте файл `@framework1.0/plugins/<имя>.framejs`.
2. Вызовите в нём `Framework.plugin('<имя>', …)`. **Имя должно совпадать с именем файла.**
3. Закоммитьте в репозиторий. Подключайте как `framecloud/1.0/<имя>`.

```js
/* Плагин hello — framecloud/1.0/hello */
Framework.plugin('hello', {
  version: '1.0.0',
  requires: ['framecloud/lib/lodash'],      // необязательно: подключатся перед install
  install(fw) {
    fw.hello = name => `Привет, ${fw.libs.lodash.capitalize(name)}!`;
  }
});
```

Короткая запись, если зависимостей нет:

```js
Framework.plugin('hello', fw => { fw.hello = () => 'Привет!'; });
```

### Что доступно в `install(fw)`

| API | Назначение |
|---|---|
| `fw.reactive(obj)` | сделать объект реактивным |
| `fw.effect(fn)` | выполнить код и перезапускать при изменении данных |
| `fw.on(событие, fn)` / `fw.emit(событие, данные)` | шина событий; встроенные: `ready`, `module:ready`, `module:fail` |
| `fw.app(селектор, опции)` | создать приложение |
| `fw.h(тег, атрибуты, …дети)` | создать DOM-элемент |
| `fw.$` / `fw.$$` | `querySelector` / `querySelectorAll` |
| `fw.libs` | подключённые библиотеки |
| `fw.plugins` | подключённые плагины |
| `fw.Yozilla` | отладчик: `log`, `info`, `success`, `warn`, `error` |

Плагин расширяет Framework, записывая своё в `fw` (`fw.hello = …`). `install` может быть `async`: Framework дождётся его завершения.

### Ошибки в плагине

Бросьте обычное исключение. Yozilla напишет `Модуль hello не смог подключиться из-за ошибки: <текст>` и покажет красное окно:

```js
install(fw) {
  if (!window.localStorage) throw new Error('нужен localStorage');
}
```

Свои сообщения можно выводить через `fw.Yozilla.warn('…')` или `fw.Yozilla.error('…')`.

## Публикация и кэш

- Файлы плагинов должны лежать в репозитории по пути `@framework1.0/plugins/<имя>.framejs`.
- jsDelivr кэширует ветку `main` **до 12 часов**. Чтобы увидеть правки сразу, очистите кэш по адресу `https://purge.jsdelivr.net/gh/IGBerko/framework@main/@framework1.0/plugins/<имя>.framejs` или публикуйте релизы с тегами и подключайте их: `…/gh/IGBerko/framework@1.0.1/…`.
- Плагины загружаются через `fetch`, поэтому им не мешает MIME-тип `.framejs`. Нужен только CORS: jsDelivr и `raw.githubusercontent.com` его отдают.
- Подключайте только плагины, которым доверяете: код плагина выполняется на странице с теми же правами, что и ваш скрипт.

## Каталог плагинов

| Плагин | Версия | Описание |
|---|---|---|
| `math` | 1.0.0 | математические функции |
| `storage` | 1.0.0 | localStorage с JSON и ttl |
| `http` | 1.0.0 | fetch с JSON, таймаутом и ошибками |

Хотите добавить свой плагин? Откройте pull request с файлом `@framework1.0/plugins/<имя>.framejs` и строкой в эту таблицу.

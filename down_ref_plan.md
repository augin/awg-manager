Да, направление правильное. Я бы оформил это как **универсальный модуль сетевой загрузки AWGM**, но с очень аккуратным первым этапом: сначала вынести уже работающий geo-download transport почти без изменения поведения, а только потом подключать остальные потребители.

Сейчас geo.dat уже фактически использует зачаток такого модуля: frontend передаёт `{ tag, kind }`, backend в `HydraRouteHandler.resolveDownloadClient()` либо скачивает напрямую, либо временно включает sing-box slot `35-download-proxy.json` с mixed inbound `127.0.0.1:11998`, selector `awgm-download-selector`, выбирает нужный outbound и только потом отдаёт `http.Client` в `GeoDataStore.DownloadWithClient/UpdateWithClient`.   

## Целевая идея

Нам нужен новый слой, условно:

```text
internal/downloader
```

или более точно:

```text
internal/netfetch
internal/downloadtransport
```

Я бы выбрал `internal/downloader`, потому что задача шире, чем просто HTTP client: нужны маршруты, прогресс, лимиты, атомарная запись файлов, checksum, ошибки, логирование и SSE.

Целевая ответственность модуля:

```text
Downloader
  - знает глобальную настройку "через что качать"
  - умеет получить http.Client через direct или выбранный sing-box/AWG outbound
  - умеет скачать файл атомарно
  - умеет скачать small text/json/blob в память с лимитом
  - умеет публиковать progress
  - не знает, что такое geo.dat, updater, sing-box installer, DNS subscriptions
```

То есть geo.dat, updater, sing-box installer и подписки становятся потребителями одного транспорта.

## Важный принцип: не смешивать transport и domain logic

GeoDataStore должен знать: “мне дали `client`, URL, path, лимит, validator”. Он не должен знать, что за этим client стоит `direct`, `AWG`, `sing-box tunnel` или временный proxy slot.

Updater должен знать: “мне надо скачать Packages.gz / IPK / changelog”. Он не должен знать, как включается `35-download-proxy.json`.

Sing-box installer должен знать: “мне надо скачать бинарь, проверить SHA256 и активировать”. Он не должен знать про selector.

Сейчас transport logic сидит в `internal/api/hydraroute.go`, то есть в API handler’е. Это и есть главный кандидат на вынос. 

---

# План рефактора

## Этап 0. Инвентаризация текущих download-потребителей

Перед кодом стоит зафиксировать все места, где AWGM тянет внешние данные:

```text
1. Geo .dat
   internal/hydraroute/geodata.go

2. AWGM updater
   internal/updater/checker.go
   internal/updater/changelog_fetch.go

3. Managed sing-box installer/update
   internal/singbox/installer/installer.go

4. Sing-box subscriptions
   internal/singbox/subscription/fetch.go

5. DNS route subscriptions / списки с GitHub
   internal/dnsroute/subscription.go

6. Потенциально HydraRoute install/update
   если появится/уже есть отдельный установщик, его подключать тем же способом
```

Почему это важно: у всех разная семантика. Geo.dat — большой файл с validator’ом. AWGM updater — Packages.gz + IPK. Sing-box installer — файл с SHA256. Подписки — маленький body с headers, redirect-limit и max body. Сейчас они используют разные HTTP-клиенты: updater ходит через `http.DefaultClient`, changelog тоже, sing-box installer держит свой `http.Client`, подписки тоже создают свои клиенты.     

---

# Этап 1. Ничего не ломаем: выносим transport, geo.dat остаётся первым потребителем

## 1.1. Добавить глобальную настройку загрузок

В `storage.Settings` добавить новый блок:

```go
type DownloadSettings struct {
    RouteTag string `json:"routeTag"` // default: "direct"
}
```

В `Settings`:

```go
Download DownloadSettings `json:"download"`
```

Сейчас в settings уже есть отдельные блоки `Updates`, `DNSRoute`, `SingboxRouter` и т.д., поэтому отдельный `Download` блок ложится нормально. 

Правило по умолчанию:

```text
routeTag пустой или "direct" → direct WAN
любой другой routeTag → качать через выбранный outbound
```

Я бы **не делал silent fallback на direct**, если пользователь выбрал туннель, а он стал недоступен. Лучше честная ошибка:

```text
configured download route "awg-xxx" is unavailable
```

Иначе пользователь может думать, что качает через VPN, а фактически AWGM пойдёт напрямую.

## 1.2. Перенести dropdown из GeoDataView в настройки

В настройках появляется раздел, например:

```text
Настройки → Загрузки
  Скачивать служебные данные через:
    Direct (WAN) — без туннеля
    My VPN — awg / iface
    Sing-box tunnel ...
    Subscription selector ...
```

Endpoint `/api/download/outbounds` можно оставить как есть, но использовать уже не только на geo-странице, а в Settings UI. Сейчас backend уже отдаёт список outbounds и помечает доступность non-direct только если sing-box running и orchestrator доступен. 

GeoDataView на первом этапе можно упростить:

```text
Скачивание использует маршрут из настроек: My VPN
[Изменить в настройках]
```

Или на время оставить read-only подпись без отдельного выбора.

## 1.3. Создать `internal/downloader`

Минимальный первый вариант:

```go
package downloader

type Route struct {
    Tag  string
    Kind string
}

type Outbound struct {
    Tag       string
    Kind      string
    Label     string
    Detail    string
    Available bool
}

type ClientLease struct {
    Client *http.Client // nil = direct default client допустим, но лучше вернуть готовый client
    RouteTag string
    RouteLabel string
    Cleanup func()
}

type Service struct {
    settings      *storage.SettingsStore
    deviceProxy   OutboundsProvider
    singboxOp     SingboxOperator
    orch          DownloadSlotController
    mu            sync.Mutex
}
```

Методы первого этапа:

```go
ListOutbounds(ctx context.Context) []Outbound

ResolveClient(ctx context.Context, override *Route) (*ClientLease, error)
```

На этапе 1 логика внутри `ResolveClient` почти полностью копируется из текущего `HydraRouteHandler.resolveDownloadClient()`:

```text
direct → обычный client
non-direct →
  проверить singboxOp
  проверить orch
  проверить sing-box running
  проверить, что tag есть в deviceProxySvc.ListOutbounds()
  взять downloadMu
  включить SlotDownloadProxy
  selector default = выбранный tag
  проверить active
  вернуть client с Proxy=http://127.0.0.1:11998
  Cleanup выключает slot и reload
```

Это даст нулевое изменение алгоритма: тот же selector, тот же slot, тот же port, тот же lifecycle. Разница только в том, что код больше не живёт в HydraRoute API handler’е.

## 1.4. Подключить geo.dat к новому Downloader

В `HydraRouteHandler.AddGeoFile/UpdateGeoFile`:

сейчас:

```go
client, restore, err := h.resolveDownloadClient(...)
entry, err := gds.DownloadWithClient(req.Type, req.URL, client)
```

после этапа 1:

```go
lease, err := h.downloader.ResolveClient(r.Context(), req.Route)
defer lease.Cleanup()

entry, err := gds.DownloadWithClient(req.Type, req.URL, lease.Client)
```

Но важно: `req.Route` лучше оставить как backward-compatible override. Новый frontend будет отправлять пустой route, а backend возьмёт `settings.Download.RouteTag`. Старые вызовы `/geo-files/add` с route продолжат работать.

## 1.5. Что точно не менять на этапе 1

Я бы не трогал сразу:

```text
- формат GeoDataStore metadata
- алгоритм validate .dat
- maxGeoFileSize
- progress key по URL
- temp/rename механику geo
- slot name 35-download-proxy.json
- port 11998
- selector tags
```

Потому что цель этапа 1 — доказать: “после выноса transport всё ещё качает geo через туннель”.

---

# Этап 1.5. Минимальные улучшения, которые можно сделать сразу, но осторожно

Есть два безопасных улучшения, которые логично включить либо в конец этапа 1, либо отдельным маленьким PR.

## Operation ID для progress

Сейчас geo progress ключуется по URL. Если две операции скачивают один URL, события перетрут друг друга. 

Новый Downloader должен генерировать:

```go
OperationID string
Purpose     string // "geo", "updater", "singbox-install", "dns-subscription"
URL         string
RouteTag    string
RouteLabel  string
Phase       string
Downloaded  int64
Total       int64
Error       string
```

Но для обратной совместимости можно пока продолжить отдавать `URL`, а `operationId` добавить рядом.

## Не держать GeoDataStore mutex во время сети

Сейчас `DownloadWithClient` берёт `s.mu.Lock()` до сетевого скачивания и держит lock до конца download + validate + save. 

Это не обязательно ломает работу, но для универсального downloader’а лучше потом разделить:

```text
lock:
  проверить лимит
  зарезервировать destination path / operation

unlock:
  скачать temp
  validate

lock:
  append entry
  save metadata
```

Но это уже отдельная техническая доработка после чистого выноса.

---

# Этап 2. Универсализируем Download API

После того как geo.dat работает через новый модуль, расширяем модуль до полноценного API.

Я бы сделал два уровня.

## Уровень A: transport/client

```go
ResolveClient(ctx, opts) (*http.Client, cleanup, routeInfo, error)
```

Это нужно для кода, которому важно самому читать body, например sing-box installer с SHA256.

## Уровень B: готовые helpers

```go
ReadAll(ctx, Request) ([]byte, ResponseMeta, error)

DownloadFile(ctx, FileRequest) (FileResult, error)

Do(ctx, Request, handler func(*http.Response) error) error
```

Пример request:

```go
type Request struct {
    Purpose      string
    URL          string
    Method       string
    Headers      http.Header
    Timeout      time.Duration
    MaxBodyBytes int64
    MaxFileBytes int64
    UserAgent    string
    RouteOverride *Route

    CheckRedirect func(req *http.Request, via []*http.Request) error
    AllowedStatus []int
    AllowedContentTypes []string

    Progress OperationProgressFn
}
```

Для файлов:

```go
type FileRequest struct {
    Request
    DestPath string
    TempPath string
    SHA256 string
    Atomic bool
    Mode os.FileMode
    Validator func(path string) error
}
```

Так мы сможем сохранить специфичные требования:

```text
geo.dat       → max 200 MB + protobuf validator + tagCount
sing-box bin  → SHA256 обязательно
IPK updater   → download to /opt/tmp + opkg install
subscriptions → max body 5 MB + headers + redirect limit
DNS lists     → content-type text/plain/octet-stream + GitHub normalize
```

---

# Этап 3. Подключаем остальных потребителей

## 3.1. AWGM updater

Сейчас:

```text
Check() скачивает Packages.gz через http.DefaultClient
Upgrade() скачивает IPK через http.DefaultClient
changelogFetcher скачивает CHANGELOG.md через http.DefaultClient
```

Это прямой кандидат на перевод.  

План:

```go
updater.Service {
    downloader downloader.Service
}
```

Меняем:

```go
fetchLatestPackage(ctx, pkgsURL, pkgName)
```

на:

```go
fetchLatestPackage(ctx, downloader, pkgsURL, pkgName)
```

А `Upgrade(ctx, downloadURL)` переводим на:

```go
downloader.DownloadFile(ctx, FileRequest{
    Purpose: "awgm-update",
    URL: downloadURL,
    DestPath: "/opt/tmp/xxx.ipk",
    MaxFileBytes: ...
})
```

Важно: `opkg install` остаётся локальной командой. Через туннель идёт только скачивание IPK.

## 3.2. Sing-box installer/update

Сейчас installer уже умеет progress и SHA256, но использует свой `http.Client{Timeout: 5 * time.Minute}`. 

На этом этапе лучше не переписывать весь installer. Достаточно внедрить dependency:

```go
type HTTPClientProvider interface {
    ResolveClient(ctx context.Context, purpose string) (*http.Client, func(), RouteInfo, error)
}
```

И в `Installer.Download()` использовать client из downloader’а, сохранив текущую SHA256-проверку и progress. Уже есть общий `internal/sys/httpdownload.Reader`, который можно переиспользовать внутри downloader’а, потому что он уже предназначен для throttled progress. 

## 3.3. DNS route subscriptions / списки с GitHub

`internal/dnsroute/subscription.go` нормализует GitHub blob/tree URL в raw.githubusercontent.com, проверяет content-type, парсит строки. Это domain logic нужно оставить там. Но HTTP GET должен уйти в downloader. 

То есть:

```go
fetchSubscription(ctx, url)
```

становится:

```go
fetchSubscription(ctx, url, downloader)
```

или сервис получает downloader в deps.

## 3.4. Sing-box subscriptions

`internal/singbox/subscription/fetch.go` уже имеет важные параметры: custom headers, forbidden headers, timeout, max body, redirect limit. Это всё должно остаться. Downloader должен уметь принять headers, max body и redirect policy. 

## 3.5. HydraRoute install/update

Я не увидел в просмотренных файлах отдельного полноценного HTTP installer’а HydraRoute, но если он есть или появится, он должен подключаться уже как обычный consumer:

```text
Purpose: "hydraroute-install"
URL/IPK/script/list
SHA256 или другой integrity check
atomic download
install command отдельно
```

---

# Структура PR’ов

Я бы не делал это одним большим PR. Оптимальный порядок:

## PR 1 — Extract geo download transport

```text
- добавить internal/downloader с transport-only логикой
- перенести туда resolveDownloadClient/list outbounds
- HydraRouteHandler использует downloader
- frontend geo визуально почти без изменений или с минимальным read-only статусом
- тест: geo.dat через direct и через выбранный outbound работает
```

## PR 2 — Global download settings

```text
- добавить Settings.Download.RouteTag
- добавить UI в Настройки
- geo перестаёт хранить route в localStorage как источник истины
- /api/download/outbounds используется Settings UI
- geo add/update берёт route из настроек
- legacy req.Route оставить как override
```

Можно поменять местами PR 1 и PR 2, но безопаснее сначала вынести backend transport, а потом двигать UI-настройку.

## PR 3 — Downloader helpers

```text
- ReadAll
- DownloadFile
- progress operationId
- max body/file
- checksum hook
- validator hook
- единый error wrapping: "download via My VPN: ..."
```

## PR 4 — Migrate AWGM updater

```text
- Packages.gz через downloader
- CHANGELOG.md через downloader
- IPK download через downloader
- opkg install не трогать
```

## PR 5 — Migrate sing-box installer

```text
- Installer.Download использует downloader client
- сохранить SHA256 logic
- сохранить singbox:install-progress или перевести на общий progress с совместимостью
```

## PR 6 — Migrate subscriptions/lists

```text
- DNS route subscriptions
- sing-box subscriptions
- GitHub raw list fetch
- сохранить headers, content-type, body limits, redirect limit
```

---

# Критичные решения до начала

## 1. Что делать, если выбранный маршрут недоступен

Мой вариант:

```text
default direct → качаем напрямую
user-selected route unavailable → ошибка, НЕ fallback direct
```

Это честнее и безопаснее.

Позже можно добавить настройку:

```text
[ ] Если выбранный туннель недоступен, временно качать напрямую
```

Но по умолчанию я бы выключил.

## 2. Нужно ли запускать sing-box ради загрузки

Сейчас non-direct доступен только если sing-box уже running. Backend явно возвращает ошибку, если sing-box не запущен. 

На этапе 1 это надо сохранить.

Автозапуск sing-box ради download — отдельная большая тема. Он может конфликтовать со sticky-stop intent, watchdog и ожиданиями пользователя. Лучше не трогать до стабилизации downloader’а.

## 3. Нужно ли делать per-module route

На первом этапе — нет. Только глобально:

```text
Все служебные загрузки AWGM через: direct / выбранный outbound
```

Позже можно расширить:

```text
Geo files: global
AWGM updates: global / direct only / custom
Sing-box updates: global
Subscriptions: global
```

Но стартовать с per-module матрицы слишком сложно.

## 4. Нужно ли сохранять `kind`

В настройках я бы хранил только `routeTag`.

`kind` динамический и может измениться. Источник истины — актуальный каталог outbounds. Если tag найден, backend сам знает label/kind/detail.

---

# Основные риски

Первый риск — текущий non-direct transport делает два sing-box reload на каждую операцию: включить временный slot и выключить его. Это уже работает для geo.dat, но когда мы подключим updater/subscriptions, частота таких операций возрастёт. Поэтому этап 2 должен подумать о более дешёвом режиме: например, держать download-proxy slot включённым дольше или включать его lazy с idle timeout. Но это не надо делать на первом PR.

Второй риск — self-update AWGM. Если updater пойдёт через sing-box, а во время обновления будет перезапускаться awg-manager/sing-box, важно, чтобы к моменту `opkg install` файл уже полностью лежал локально. Это нормально: через туннель идёт только download, установка потом локальная.

Третий риск — SSRF/redirect. Сейчас geo URL validation блокирует только localhost/private IP literal, но не гарантирует защиту от hostname, который резолвится в private IP, и от redirect’ов.  Универсальный downloader — хорошее место, чтобы потом централизованно закрыть это для пользовательских URL. Но для repo.hoaxisr.ru и pinned binary URLs правила могут быть мягче, потому что это trusted URLs.

---

# Итоговая архитектура

```text
storage.Settings.Download.RouteTag
        │
        ▼
internal/downloader.Service
        │
        ├── ListOutbounds()
        │     └── deviceProxySvc.ListOutbounds()
        │
        ├── ResolveClient()
        │     ├── direct → normal HTTP client
        │     └── selected route →
        │           sing-box SlotDownloadProxy
        │           awgm-download-selector
        │           http proxy 127.0.0.1:11998
        │
        ├── ReadAll()
        └── DownloadFile()
              │
              ├── geo.dat
              ├── AWGM updater
              ├── sing-box installer
              ├── DNS/GitHub lists
              └── subscriptions
```

Твой двухэтапный план я бы формализовал так:

```text
Этап 1:
  универсальный transport уже существует,
  но реально используется только geo.dat.
  Цель — не сломать рабочий алгоритм.

Этап 2:
  transport превращается в полноценный downloader,
  остальные download-потребители постепенно переводятся на него.
```

Это правильная последовательность: сначала стабилизируем общий механизм на уже работающем geo.dat, потом начинаем расширять покрытие.

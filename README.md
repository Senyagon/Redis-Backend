# Redis-Backend

Backend API на `NestJS` + `Prisma` для каталога товаров, категорий и авторизации пользователей.

Важно: несмотря на название репозитория, проект сейчас работает с `PostgreSQL`, а не с Redis.

## Что нужно перед запуском

- `Node.js` 20+
- `Yarn` 1.x
- `PostgreSQL` 14+

Проверить версии можно так:

```bash
node -v
yarn -v
psql --version
```
Then install and setup PostgreSQL & add it to .env

## Настройка проекта после скачивания с GitHub

### 1. Клонирование репозитория

```bash
git clone https://github.com/Senyagon/Redis-Backend/edit/main/README.md
cd Redis-Backend
```

### 2. Установка зависимостей

```bash
yarn install
```

### 3. Создание файла окружения

Скопируйте шаблон:

```bash
cp .env.example .env
```

Если вы на Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Заполните переменные в `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/redis_catalog"
JWT_SECRET="your-very-strong-secret"
JWT_EXPIRES_IN=3600s
PORT=3000
```

### 4. Создание базы данных PostgreSQL

Создайте базу данных, имя которой указано в `DATABASE_URL`.

Пример для `psql`:

```sql
CREATE DATABASE redis_catalog;
```

### 5. Применение миграций Prisma

После создания базы выполните:

```bash
npx prisma migrate deploy
npx prisma generate
```

Если вы разрабатываете локально и хотите, чтобы Prisma сама создавала новые миграции при изменении схемы, можно использовать:

```bash
npx prisma migrate dev
```

### 6. Запуск проекта

Режим разработки:

```bash
yarn start:dev
```

Обычный запуск:

```bash
yarn start
```

Продакшен-запуск:

```bash
yarn build
yarn start:prod
```

## Где открыть проект после запуска

- API: [http://localhost:3000](http://localhost:3000)
- Swagger-документация: [http://localhost:3000/api](http://localhost:3000/api)
- Статические файлы из папки `uploads`: [http://localhost:3000/uploads](http://localhost:3000/uploads)

Если у вас изменён `PORT`, используйте свой порт из `.env`.

## Полезные команды

```bash
# Prisma Studio
npx prisma studio

# линтер
yarn lint

# форматирование
yarn format

# unit-тесты
yarn test

# e2e-тесты
yarn test:e2e

# покрытие
yarn test:cov
```

## Что делать, если проект не стартует

### Ошибка подключения к базе

Проверьте:

- запущен ли `PostgreSQL`
- существует ли база `redis_catalog`
- правильные ли логин, пароль, порт и имя базы в `DATABASE_URL`

### Ошибка Prisma Client

Перегенерируйте Prisma Client:

```bash
npx prisma generate
```

### Порт уже занят

Измените `PORT` в `.env`, например:

```env
PORT=3001
```

## Структура проекта

- `src/auth` - авторизация и JWT
- `src/category` - категории товаров
- `src/product` - товары и загрузка изображений
- `src/prisma` - подключение Prisma к PostgreSQL
- `prisma/schema.prisma` - схема базы данных
- `prisma/migrations` - миграции базы данных

## Первый запуск с нуля в одной последовательности

```bash
git clone https://github.com/Senyagon/Redis-Backend/edit/main/README.md
cd Redis-Backend
yarn install
cp .env.example .env
npx prisma migrate deploy
npx prisma generate
yarn start:dev
```

После этого откройте Swagger: [http://localhost:3000/api](http://localhost:3000/api)

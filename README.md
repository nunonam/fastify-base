# API Server Doc

## Build & Run

```
// development build & run
npm run dev
```

## MSSQL Database Connection

MSSQL 데이터베이스 연결을 위해 다음 환경 변수를 설정하세요:

```bash
# MSSQL Database Connection
DB_SERVER=localhost
DB_DATABASE=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433

# MSSQL Connection Options
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
DB_CONNECTION_TIMEOUT=30000
DB_REQUEST_TIMEOUT=30000
```

### 사용 예시

```typescript
// 라우트에서 사용
fastify.get("/users", async (request, reply) => {
  const result = await fastify.mssql.query("SELECT * FROM Users");
  return result.recordset;
});

// 파라미터화된 쿼리
const result = await fastify.mssql.query(
  "SELECT * FROM Users WHERE id = @id",
  { id: 1 },
);

// Request 객체 직접 사용 (더 세밀한 제어)
const request = fastify.mssql.request();
request.input("id", sql.Int, 1);
const result = await request.query("SELECT * FROM Users WHERE id = @id");
```

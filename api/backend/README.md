start cloud sql proxy:
```bash
mkdir -p /cloudsql
chmod 777 /cloudsql
./cloud_sql_proxy -dir=/cloudsql -instances=ai-canvas:europe-west1:sql-server

```
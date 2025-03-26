```
npm install
docker build -t jwt-benchmark-api .
docker run \
  -p 3000:3000 \
  --rm \
  --name jwt-bench-app \
  --cpus="1.0" \
  --memory="1g" \
  jwt-benchmark-api
```



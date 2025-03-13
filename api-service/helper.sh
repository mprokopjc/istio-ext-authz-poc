docker build -t api-service:latest .
docker tag api-service:latest localhost:5000/api-service:latest
docker push localhost:5000/api-service:latest

# recreate api-service
kubectl delete pods -l app=api-service
kubectl apply -f api-service.yaml
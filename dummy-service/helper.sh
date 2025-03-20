docker build -t dummy-service:latest .
docker tag dummy-service:latest localhost:5000/dummy-service:latest
docker push localhost:5000/dummy-service:latest

# recreate dummy-service
kubectl delete pods -l app=dummy-service
kubectl apply -f dummy-service.yaml
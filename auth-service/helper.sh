docker build -t auth-service:latest .
docker tag auth-service:latest localhost:5000/auth-service:latest
docker push localhost:5000/auth-service:latest

# recreate auth-service
kubectl delete pods -l app=auth-service
kubectl apply -f auth-service.yaml
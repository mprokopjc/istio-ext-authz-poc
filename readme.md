### Prerequisites 

1. In Docker Desktop enable k8s one node cluster `Settigns/Kubernetes/Enable Kubernetes`
1. Start local docker registry `docker run -d -p 5000:5000 --name registry registry:2.7` 

## Deploy Istio gateway

```
brew install istioctl
istioctl install --set profile=demo -y
kubectl label namespace default istio-injection=enabled
```

## Deploy an External Authorization Service (Auth Service):

```
cd auth-service
docker build -t auth-service:latest .
docker tag auth-service:latest localhost:5000/auth-service:latest
docker push localhost:5000/auth-service:latest
# run it
kubectl apply -f auth-service.yaml
```

# Enable external authorization

```
kubectl apply -f envoy-filter.yaml
```

## Deploy Sample API service (handling API requests)

```
cd sample-api-service
docker build -t api-service:latest .
docker tag api-service:latest localhost:5000/api-service:latest
docker push localhost:5000/api-service:latest
# run it
kubectl apply -f api-service.yaml
```

## Enable routing to API service

```
kubectl apply -f api-gateway.yaml
```

# Test Setup

```
kubectl get svc istio-ingressgateway -n istio-system
curl -H "Authorization: Bearer valid-token" http://localhost:80/api
```
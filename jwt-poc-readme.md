### Prerequisites 

1. In Docker Desktop enable k8s one node cluster `Settigns/Kubernetes/Enable Kubernetes`
1. Start local docker registry `docker run -d -p 5000:5000 --name registry registry:2.7` 

## Deploy Istio gateway

```
brew install istioctl
istioctl install --set profile=demo -y
kubectl label namespace default istio-injection=enabled
```

## Deploy API service and configure Istio

```
cd ./api-service
./helper.sh
cd ..
kubectl apply -f api-gateway.yaml
kubectl apply -f api-authorization.yaml
```

## Test it out

Get https://raw.githubusercontent.com/istio/istio/release-1.25/security/tools/jwt/samples/gen-jwt.py and then use it to send test request

```
# get valid JWT (signed by Istio demo private key - so we don't need custom jwks)
python gen-jwt.py --issuer testing@secure.istio.io --audience api-service --scope "protected:read"
# use JWT to send request to protected endpoint
curl -H "Authorization: Bearer <your-copied-jwt>" http://localhost:80/api/protected
```

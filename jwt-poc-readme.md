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

See https://github.com/istio/istio/tree/master/security/tools/jwt/samples and get `gen-jwt.py` and `key.pem` to generate a valid JWT using:

```
python gen-jwt.py --issuer testing@secure.istio.io --audience api-service --scope "protected:read"
```

Then use generate JWT to call protecte endpoint. (We are using Istio demo JWKS so we don't have to configure our own in this POC.)

```
curl -H "Authorization: Bearer <your-copied-jwt>" http://localhost:80/api/protected
```

#!/usr/bin/env bash

set -e

mkdir ~/.kube

echo "
apiVersion: v1
kind: Config
clusters:
- name: default-cluster
  cluster:
    certificate-authority-data: ${KUBERNETES_CA}
    server: https://thang.io:6443
contexts:
- name: default-context
  context:
    cluster: default-cluster
    namespace: default
    user: travis
current-context: default-context
users:
- name: travis
  user:
    token: ${KUBERNETES_TOKEN}
" > ~/.kube/config

export VERSION="$TRAVIS_COMMIT"

docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD"

npm run deploy

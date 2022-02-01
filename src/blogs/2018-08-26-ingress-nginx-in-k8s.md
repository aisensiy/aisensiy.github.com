---
layout:     post
title:      "采用 ingress-nginx 将服务暴露到外部"
date:       2018-08-26 00:11:11 +08:00
author:     "Eisen"
tags:       [docker, devops, kubernetes, ingress]
categories: ["kubernetes 运维"]
---


记录在采用 ingress-nginx 暴露内部服务的过程

## 安装

ingress-nginx 是 ingress 的一个实现，目前它已经被放在 `kubernetes` 项目下面了，可见算是亲儿子了，可更新频率也非常高，再加上之前在别的环境用 nginx 的场景也很多，没想太多就觉得用它了。

在我安装 ingress-nginx 的时候，其最新的版本是 `0.16.2`。首先遵循文档先安装 [`mandatory.yaml`](https://github.com/kubernetes/ingress-nginx/blob/nginx-0.16.2/deploy/mandatory.yaml)：

```sh
kubectl apply -f \
    https://raw.githubusercontent.com/kubernetes/ingress-nginx/nginx-0.16.2/deploy/mandatory.yaml
```

这一步里面做了如下的事情：

1. 创建 `ingress-nginx` namespace
2. 部署默认的 backend
3. 创建相应的 ConfigMap
4. 创建 ServiceAccount 并授权
5. 部署 nginx-ingress-controller

## 创建 service 暴露到集群外部

这也是一个神奇的操作，虽说 ingress 才是真正将服务暴露到外面的资源，但是实际上反而是一个 `service` 完成了最终将服务暴露出去的任务。这里我们可以有多种选择：

要么采用 `NodePort` 将 service 通过某一个特定的端口：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
spec:
  type: NodePort
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
  - name: https
    port: 443
    targetPort: 443
    protocol: TCP
  selector:
    app: ingress-nginx
```

要么采用 `externalIPS` 直接将 `service` 通过特定的 IP 暴露出去：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
spec:
  externalIPs:
  - <external-ips>
  ports:
  - name: http
    port: 80
    targetPort: 80
    protocol: TCP
  - name: https
    port: 443
    targetPort: 443
    protocol: TCP
  selector:
    app: ingress-nginx
```

这里我采用的是第二种，这样暴露出来的服务更干净。

然后测试一下看看是否工作：

    curl http://<external-ip>
    
如果返回 404 说明已经链接到了默认的 backend 了。

## 暴露服务到外部

然后我们再创建一个 `ingress` 将我们的 java service 暴露到路径 `/api` 下：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: openbayes-server-ing
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  rules:
  - http:
      paths:
      - path: /api
        backend:
          serviceName: openbayes-server-svc
          servicePort: 80
```

```sh
kubectl apply -f ingress.yaml
```

然后再尝试一下 `curl http://<external-ip>/api` 看看是不是可以正常的访问这个 api。

## 采用 annotation 对特定服务做配置

默认的 nginx 配置未必适合我们的服务，访问 [Nginx Configuration](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/) 可以看到 ingress-nginx 所提供的三种 nginx 配置方式。其中 [ConfigMaps](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/) 可以实现对 nginx 默认配置的修改；而 [ingress annotation](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/) 则可以实现对特定 ingress 进行配置。

比如我们的 `/api` 有上传文件的需求，而默认的请求尺寸最大为 `1m` 会导致文件上传报错 `413`，通过添加注解 `nginx.ingress.kubernetes.io/proxy-body-size` 可以指定请求大小限制：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: openbayes-server-ing
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "1024m"
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  rules:
  - http:
      paths:
      - path: /api
        backend:
          serviceName: openbayes-server-svc
          servicePort: 80
```

每次修改 ingress 后，nginx-ingress-controller 会默认更新 nginx.conf，立即生效。


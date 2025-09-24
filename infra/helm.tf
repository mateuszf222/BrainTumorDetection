resource "helm_release" "backend" {
  name       = "backend"
  namespace  = "default"
  chart      = "${path.module}/charts/backend"
  values     = [file("${path.module}/charts/backend/values.yaml")]
  
  depends_on = [module.eks,kubernetes_secret.backend_db]
}

resource "helm_release" "frontend" {
  name       = "frontend"
  namespace  = "default"
  chart      = "${path.module}/charts/frontend"
  values     = [file("${path.module}/charts/frontend/values.yaml")]
  
  depends_on = [module.eks]
}

resource "helm_release" "backend_python" {
  name       = "backend-python"
  namespace  = "default"
  chart      = "${path.module}/charts/backend-python"
  values     = [file("${path.module}/charts/backend-python/values.yaml")]
  
  depends_on = [module.eks]
}

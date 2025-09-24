resource "kubernetes_secret" "backend_db" {
  metadata {
    name      = "backend-db-url"
    namespace = "default"
  }

  data = {
    DB_URL = var.db_url
  }

  type = "Opaque"
}

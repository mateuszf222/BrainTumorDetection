module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.1.0"

  name                = var.cluster_name
  kubernetes_version  = "1.33"

  addons = {
    coredns                = {}
    eks-pod-identity-agent = { before_compute = true }
    kube-proxy             = {}
    vpc-cni                = { before_compute = true }
  }

  endpoint_public_access                    = true
  enable_cluster_creator_admin_permissions  = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    eks_nodes = {
      desired_size   = 1
      max_size       = 3
      min_size       = 1
      instance_types = ["t3.small"]
      capacity_type  = "ON_DEMAND"

      tags = {
        "k8s.io/cluster-autoscaler/enabled"             = "true"
        "k8s.io/cluster-autoscaler/${var.cluster_name}" = "owned"
      }
    }
  }

  tags = {
    Environment = "dev"
    Terraform   = "true"
  }
}

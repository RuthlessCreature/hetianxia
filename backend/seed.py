import uuid
from datetime import datetime, timedelta

from sqlmodel import Session

from app.db.database import engine, init_db
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User
from app.models.project import Project


def seed():
    init_db()

    with Session(engine) as db:
        # Check if already seeded
        existing = db.query(Tenant).first()
        if existing:
            print("Database already seeded, skipping.")
            return

        # Tenant
        tenant_id = "t_demo_seed_0001"
        tenant = Tenant(
            id=tenant_id,
            name="高纳AI演示公司",
            plan="pro",
            license_start=datetime.utcnow() - timedelta(days=30),
            license_end=datetime.utcnow() + timedelta(days=335),
            status="active",
            max_users=20,
            max_projects=20,
            max_images=200000,
            max_storage_gb=500,
            max_training_jobs_per_month=200,
            max_prelabel_jobs_per_month=200,
            allow_model_export=True,
            allow_private_deploy=False,
        )
        db.add(tenant)

        # Users
        users_data = [
            {"id": "u_seed_owner", "email": "owner@demo.com", "name": "张总", "password": "demo123", "role": "owner"},
            {"id": "u_seed_admin", "email": "admin@demo.com", "name": "李管理", "password": "demo123", "role": "admin"},
            {"id": "u_seed_engineer", "email": "engineer@demo.com", "name": "王工", "password": "demo123", "role": "engineer"},
            {"id": "u_seed_labeler", "email": "labeler@demo.com", "name": "赵标注", "password": "demo123", "role": "labeler"},
            {"id": "u_seed_viewer", "email": "viewer@demo.com", "name": "钱查看", "password": "demo123", "role": "viewer"},
        ]
        for u in users_data:
            user = User(
                id=u["id"],
                tenant_id=tenant_id,
                email=u["email"],
                name=u["name"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                status="active",
            )
            db.add(user)

        # Projects
        projects_data = [
            {"name": "手机中框划痕检测", "task_type": "defect_detection", "description": "检测手机中框表面的各类划痕缺陷"},
            {"name": "PCB焊点检测", "task_type": "defect_detection", "description": "检测PCB板焊点虚焊、连锡等缺陷"},
            {"name": "玻璃盖板外观检测", "task_type": "classification", "description": "分类识别玻璃盖板的OK/NG"},
            {"name": "连接器外观异常检测", "task_type": "anomaly_detection", "description": "只用OK样本做异常检测，识别未知缺陷"},
        ]
        for p in projects_data:
            project = Project(
                id=f"p_{uuid.uuid4().hex[:12]}",
                tenant_id=tenant_id,
                name=p["name"],
                description=p.get("description"),
                task_type=p["task_type"],
                created_by="u_seed_owner",
            )
            db.add(project)

        db.commit()
        print(f"Seed data created: {len(users_data)} users, {len(projects_data)} projects")

        print()
        print("Demo accounts:")
        for u in users_data:
            print(f"  {u['email']} / {u['password']} ({u['role']})")


if __name__ == "__main__":
    seed()

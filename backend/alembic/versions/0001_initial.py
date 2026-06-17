"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-16

Cria o schema base do MVP: usuários, produtos, mercados, preços, listas, itens
e a associação de colaboradores.
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=2048), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "products",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("image_url", sa.String(length=4096), nullable=False),
        sa.Column("unit", sa.String(length=40), nullable=False),
        sa.Column("brand", sa.String(length=80), nullable=True),
        sa.Column("barcode", sa.String(length=14), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_products_name", "products", ["name"])
    op.create_index("ix_products_category", "products", ["category"])
    op.create_index("ix_products_barcode", "products", ["barcode"])

    op.create_table(
        "markets",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("brand_color", sa.String(length=16), nullable=True),
        sa.Column("logo_url", sa.String(length=4096), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "prices",
        sa.Column("product_id", sa.String(length=64), nullable=False),
        sa.Column("market_id", sa.String(length=64), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["market_id"], ["markets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("product_id", "market_id"),
    )

    op.create_table(
        "shopping_lists",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("owner_id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_shopping_lists_owner_id", "shopping_lists", ["owner_id"])

    op.create_table(
        "list_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("list_id", sa.String(length=32), nullable=False),
        sa.Column("product_id", sa.String(length=64), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["list_id"], ["shopping_lists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("list_id", "product_id", name="uq_list_item_product"),
    )
    op.create_index("ix_list_items_list_id", "list_items", ["list_id"])

    op.create_table(
        "list_collaborators",
        sa.Column("list_id", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["list_id"], ["shopping_lists.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("list_id", "user_id"),
    )


def downgrade() -> None:
    op.drop_table("list_collaborators")
    op.drop_index("ix_list_items_list_id", table_name="list_items")
    op.drop_table("list_items")
    op.drop_index("ix_shopping_lists_owner_id", table_name="shopping_lists")
    op.drop_table("shopping_lists")
    op.drop_table("prices")
    op.drop_table("markets")
    op.drop_index("ix_products_barcode", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
    op.drop_index("ix_products_name", table_name="products")
    op.drop_table("products")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

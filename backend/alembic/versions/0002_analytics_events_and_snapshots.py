"""analytics: search_events and comparison_snapshots

Revision ID: 0002_analytics
Revises: 0001_initial
Create Date: 2026-06-21

Cria as tabelas de inteligência:
- search_events: eventos de busca (ranking de produtos/categorias);
- comparison_snapshots: histórico de comparações registradas pelo usuário
  (economia média, economias recentes e competitividade dos mercados).
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0002_analytics"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "search_events",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=32), nullable=True),
        sa.Column("product_id", sa.String(length=64), nullable=True),
        sa.Column("category", sa.String(length=40), nullable=True),
        sa.Column("query", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_search_events_user_id", "search_events", ["user_id"])
    op.create_index("ix_search_events_product_id", "search_events", ["product_id"])
    op.create_index("ix_search_events_category", "search_events", ["category"])
    op.create_index("ix_search_events_created_at", "search_events", ["created_at"])

    op.create_table(
        "comparison_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=32), nullable=False),
        sa.Column("shopping_list_id", sa.String(length=32), nullable=True),
        sa.Column("list_name", sa.String(length=120), nullable=False),
        sa.Column("cheapest_market_id", sa.String(length=64), nullable=True),
        sa.Column("most_expensive_market_id", sa.String(length=64), nullable=True),
        sa.Column("cheapest_total", sa.Float(), nullable=False),
        sa.Column("most_expensive_total", sa.Float(), nullable=False),
        sa.Column("saved_amount", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("cheapest_total >= 0", name="ck_snapshot_cheapest_total"),
        sa.CheckConstraint(
            "most_expensive_total >= 0", name="ck_snapshot_most_expensive_total"
        ),
        sa.CheckConstraint("saved_amount >= 0", name="ck_snapshot_saved_amount"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["shopping_list_id"], ["shopping_lists.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["cheapest_market_id"], ["markets.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["most_expensive_market_id"], ["markets.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_comparison_snapshots_user_id", "comparison_snapshots", ["user_id"]
    )
    op.create_index(
        "ix_comparison_snapshots_shopping_list_id",
        "comparison_snapshots",
        ["shopping_list_id"],
    )
    op.create_index(
        "ix_comparison_snapshots_created_at", "comparison_snapshots", ["created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_comparison_snapshots_created_at", table_name="comparison_snapshots")
    op.drop_index(
        "ix_comparison_snapshots_shopping_list_id", table_name="comparison_snapshots"
    )
    op.drop_index("ix_comparison_snapshots_user_id", table_name="comparison_snapshots")
    op.drop_table("comparison_snapshots")
    op.drop_index("ix_search_events_created_at", table_name="search_events")
    op.drop_index("ix_search_events_category", table_name="search_events")
    op.drop_index("ix_search_events_product_id", table_name="search_events")
    op.drop_index("ix_search_events_user_id", table_name="search_events")
    op.drop_table("search_events")

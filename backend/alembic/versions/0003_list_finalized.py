"""shopping_lists.finalized

Revision ID: 0003_list_finalized
Revises: 0002_analytics
Create Date: 2026-06-23

Adiciona a coluna `finalized` em `shopping_lists`. Listas finalizadas entraram
no dashboard (snapshot registrado) e não podem mais ser excluídas/editadas.
Default 0 (false) — listas existentes continuam editáveis.
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0003_list_finalized"
down_revision: Union[str, None] = "0002_analytics"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "shopping_lists",
        sa.Column(
            "finalized",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )


def downgrade() -> None:
    op.drop_column("shopping_lists", "finalized")

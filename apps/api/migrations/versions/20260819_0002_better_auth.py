"""Create the Better Auth schema and JWT key store.

The SQL mirrors the Better Auth PostgreSQL schema for the pinned web
dependency. Alembic remains the only production migration mechanism.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260819_0002"
down_revision: Union[str, None] = "20260819_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS auth")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS auth."user" (
            "id" text PRIMARY KEY,
            "name" text NOT NULL,
            "email" text NOT NULL UNIQUE,
            "emailVerified" boolean NOT NULL DEFAULT false,
            "image" text,
            "role" text NOT NULL DEFAULT 'USER',
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            CONSTRAINT user_role_check CHECK ("role" IN ('USER', 'ADMIN'))
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS auth."session" (
            "id" text PRIMARY KEY,
            "expiresAt" timestamptz NOT NULL,
            "token" text NOT NULL UNIQUE,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            "ipAddress" text,
            "userAgent" text,
            "userId" text NOT NULL REFERENCES auth."user"("id") ON DELETE CASCADE
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS auth."account" (
            "id" text PRIMARY KEY,
            "accountId" text NOT NULL,
            "providerId" text NOT NULL,
            "userId" text NOT NULL REFERENCES auth."user"("id") ON DELETE CASCADE,
            "accessToken" text,
            "refreshToken" text,
            "idToken" text,
            "accessTokenExpiresAt" timestamptz,
            "refreshTokenExpiresAt" timestamptz,
            "scope" text,
            "password" text,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            CONSTRAINT account_provider_identity_unique UNIQUE ("providerId", "accountId")
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS auth."verification" (
            "id" text PRIMARY KEY,
            "identifier" text NOT NULL,
            "value" text NOT NULL,
            "expiresAt" timestamptz NOT NULL,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS auth."jwks" (
            "id" text PRIMARY KEY,
            "publicKey" text NOT NULL,
            "privateKey" text NOT NULL,
            "createdAt" timestamptz NOT NULL,
            "expiresAt" timestamptz
        )
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS session_user_id_idx ON auth."session" ("userId")')
    op.execute('CREATE INDEX IF NOT EXISTS account_user_id_idx ON auth."account" ("userId")')
    op.execute(
        'CREATE INDEX IF NOT EXISTS verification_identifier_idx ON auth."verification" ("identifier")'
    )


def downgrade() -> None:
    raise RuntimeError("Better Auth migrations are forward-only; restore a database backup instead")

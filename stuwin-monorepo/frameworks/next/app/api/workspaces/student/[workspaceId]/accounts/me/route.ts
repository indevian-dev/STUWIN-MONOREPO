import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import { eq, and } from 'drizzle-orm';
import { accounts, users, workspaceRoles, workspaceToWorkspace } from '@/lib/app-infrastructure/database/schema';

export const GET = unifiedApiHandler(async (request, { auth, db, log, params }) => {
  try {
    const accountId = auth.accountId;
    const workspaceId = params.workspaceId as string;

    log.debug('Fetching account data', { accountId, workspaceId });

    // Fetch account with user and role data using Drizzle
    // We join workspaceToWorkspace to find the role of this account in this workspace
    const accountResult = await db
      .select({
        account: accounts,
        user: users,
        role: workspaceRoles
      })
      .from(accounts)
      .innerJoin(users, eq(accounts.userId, users.id))
      .leftJoin(workspaceToWorkspace, and(
        eq(workspaceToWorkspace.accountId, accounts.id),
        eq(workspaceToWorkspace.toWorkspaceId, workspaceId)
      ))
      .leftJoin(workspaceRoles, eq(workspaceToWorkspace.role, workspaceRoles.name))
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (!accountResult.length) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    const data = accountResult[0];

    const accountData = {
      account: {
        id: data.account.id,
        created_at: data.account.createdAt,
        updated_at: data.account.updatedAt,
        suspended: data.account.suspended,
        role: data.role ? {
          id: data.role.id,
          name: data.role.name,
          permissions: data.role.permissions
        } : null,
        is_personal: false, // Calculated/Legacy field, schema doesn't have it,
      },
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.firstName,
        last_name: data.user?.lastName,
        avatar_url: data.user?.avatarUrl,
        phone: data.user?.phone,
        email_is_verified: data.user?.emailIsVerified,
        phone_is_verified: data.user?.phoneIsVerified,
      },
      permissions: (data.role?.permissions as string[]) || []
    };

    log.info('Account data fetched', { accountId });
    return NextResponse.json(accountData);
  } catch (error) {
    log.error('Error fetching account data', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, {
  authRequired: true
});

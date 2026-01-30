import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext, DbTransaction } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { cleanPhoneNumber, validateAzerbaijanPhone } from '@/lib/utils/phoneFormatterUtility';
/**
 * Update contact information for unverified users
 * This allows users who entered wrong email/phone during registration to correct it
 * Only works for users who haven't verified their email yet
 */
export const PATCH: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { email, phone } = body;
    const accountId = authData.account.id;
    const userId = authData.user.id;
    // Validate that at least one contact method is provided
    if (!email && !phone) {
      return NextResponse.json({
        error: 'Either email or phone must be provided'
      }, { status: 400 });
    }
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({
        error: 'Invalid email format',
        field: 'email'
      }, { status: 400 });
    }
    // Validate phone format if provided
    let cleanedPhone = null;
    if (phone) {
      cleanedPhone = cleanPhoneNumber(phone);
      if (!validateAzerbaijanPhone(cleanedPhone)) {
        return NextResponse.json({
          error: 'Please provide a valid Azerbaijan phone number',
          field: 'phone'
        }, { status: 400 });
      }
    }
    // First, verify user exists and is not verified yet
    const userResult = await db.query(
      'SELECT id, email, phone, emailIsVerified, phoneIsVerified, name FROM users WHERE id = $userId LIMIT 1',
      { userId }
    );
    if (!userResult.length) {
      throw new Error('User not found');
    }
    const user = userResult[0];

    // Only allow contact updates for unverified users
    if (user.emailIsVerified) {
      throw new Error('Cannot update contact information for verified users. Please use account settings instead.');
    }

    // Check if new email is already taken by a verified user
    if (email && email !== user.email) {
      const existingEmailResult = await db.query(
        'SELECT id FROM users WHERE email = $email AND emailIsVerified = true AND id != $userId LIMIT 1',
        { email, userId }
      );
      if (existingEmailResult.length > 0) {
        throw new Error('This email is already registered and verified');
      }
    }

    // Check if new phone is already taken by a verified user
    if (cleanedPhone && cleanedPhone !== user.phone) {
      const existingPhoneResult = await db.query(
        'SELECT id FROM users WHERE phone = $phone AND emailIsVerified = true AND id != $userId LIMIT 1',
        { phone: cleanedPhone, userId }
      );
      if (existingPhoneResult.length > 0) {
        throw new Error('This phone number is already registered and verified');
      }
    }

    // Update contact information
    const updateFields: any = { updatedAt: new Date().toISOString() };
    if (email) updateFields.email = email;
    if (cleanedPhone) updateFields.phone = cleanedPhone;

    const updateResult = await db.query(
      'UPDATE users SET email = $email, phone = $phone, updatedAt = $updatedAt WHERE id = $userId RETURN AFTER',
      {
        email: email || user.email,
        phone: cleanedPhone || user.phone,
        updatedAt: updateFields.updatedAt,
        userId
      }
    );

    const result = updateResult[0];
    return NextResponse.json({
      success: true,
      message: 'Contact information updated successfully',
      user: {
        id: result.id,
        email: result.email,
        phone: result.phone,
        name: result.name,
        email_is_verified: result.emailIsVerified,
        phone_is_verified: result.phoneIsVerified
      }
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update contact information';
    return NextResponse.json({
      error: errorMessage
    }, { status: 500 });
  }
});


